import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/prisma/prisma.service';
import { ROLES_SIN_TECNICO } from 'src/auth/roles/grupos-roles';
import {
  NOTIFICACION,
  NotificacionFacadePort,
} from 'src/modules/notificacion/public/notificacion.facade.port';
import {
  CategoriaNotificacion,
  SeveridadNotificacion,
} from 'src/modules/notificacion/public/notificacion.types';

import {
  CLIENTE_FACTURABLE_WHERE,
  ESTADOS_FACTURA_PENDIENTE,
  shouldSkipZoneToday,
} from '../helpers/Functions';
import { FacturacionUtilitiesService } from '../utilities/factura-manager.service';

@Injectable()
export class SegundoRecordatorioCronService {
  private readonly logger = new Logger(SegundoRecordatorioCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly facturacionServices: FacturacionUtilitiesService,
    @Inject(NOTIFICACION)
    private readonly notificaciones: NotificacionFacadePort,
  ) {}

  @Cron('0 10 * * *', { timeZone: 'America/Guatemala' })
  async generarMensajeSegundoRecordatorio(): Promise<void> {
    this.logger.debug('Verificando zonas de facturación: Recordatorio 2');

    const TEMPLATE_NAME =
      this.configService.get<string>('RECORDATORIO_FACTURA_PLANTILLA') ??
      (() => {
        throw new InternalServerErrorException(
          'Nombre de plantilla faltante: RECORDATORIO_FACTURA_PLANTILLA',
        );
      })();

    const zonas = await this.prisma.facturacionZona.findMany({
      where: { eliminadoEn: null },
      include: {
        clientes: {
          where: CLIENTE_FACTURABLE_WHERE,
          select: {
            id: true,
          },
        },
      },
    });

    for (const zona of zonas) {
      if (shouldSkipZoneToday(zona.diaSegundoRecordatorio)) continue;

      const zonaPermiteRecordatorio =
        zona.enviarRecordatorio && zona.enviarRecordatorio2; //&& zona.whatsapp;

      if (!zonaPermiteRecordatorio) {
        this.logger.debug(
          `Zona ${zona.id} no permite Recordatorio 2; se omite.`,
        );
        continue;
      }

      this.logger.log(
        `--- Iniciando Recordatorio 2 para Zona: ${zona.nombre} (${zona.id}) ---`,
      );

      const contador = {
        clientesOperados: 0,
        clientesRecordados: 0,
        clientesOmitidos: 0,
        erroresCriticos: 0,
      };

      for (const cliente of zona.clientes) {
        contador.clientesOperados++;

        try {
          /**
           * Recordatorio 2 NO crea factura.
           * Solo obtiene la factura existente del periodo.
           */
          const { factura } =
            await this.facturacionServices.obtenerOcrearFactura(
              cliente.id,
              zona,
              false,
            );

          await this.facturacionServices.actualizarEstadoCobranzaCliente(
            factura,
          );

          const facturaRequiereRecordatorio =
            ESTADOS_FACTURA_PENDIENTE.includes(factura.estadoFacturaInternet);

          if (!facturaRequiereRecordatorio) {
            this.logger.debug(
              `Factura ${factura.id} no requiere Recordatorio 2. Estado: ${factura.estadoFacturaInternet}`,
            );
            contador.clientesOmitidos++;
            continue;
          }

          const enviados =
            await this.facturacionServices.enviarWhatsAppFacturaMeta(
              factura.clienteId,
              factura,
              TEMPLATE_NAME,
            );

          if (enviados > 0) {
            contador.clientesRecordados++;
          } else {
            contador.clientesOmitidos++;
          }
        } catch (error: any) {
          if (error instanceof NotFoundException) {
            this.logger.debug(
              `Cliente ${cliente.id} sin factura del periodo; no se envía Recordatorio 2.`,
            );
            contador.clientesOmitidos++;
            continue;
          }

          this.logger.warn(
            `Recordatorio 2 falló | Zona ${zona.id} Cliente ${cliente.id}: ${error?.message ?? error}`,
          );
          contador.erroresCriticos++;
        }
      }

      this.logger.log(
        `Resumen Recordatorio 2 Zona ${zona.nombre} (${zona.id}): ` +
          `operados=${contador.clientesOperados}, ` +
          `recordados=${contador.clientesRecordados}, ` +
          `omitidos=${contador.clientesOmitidos}, ` +
          `errores=${contador.erroresCriticos}`,
      );

      await this.notificaciones.notificar({
        mensaje: `El servicio de recordatorios (Aviso 2) ha trabajado la zona: ${zona.nombre} y ha generado lo siguiente:
Clientes operados: ${contador.clientesOperados}
Recordatorios enviados: ${contador.clientesRecordados}
Omitidos: ${contador.clientesOmitidos}
Errores críticos: ${contador.erroresCriticos}`,
        destino: { roles: ROLES_SIN_TECNICO },
        categoria: CategoriaNotificacion.COBRANZA,
        titulo: 'Segundo Recordatorio de Pago',
        subtipo: 'CRON JOB',
        referencia: { tipo: 'FACTURACION_ZONA', id: zona.id },
        severidad: SeveridadNotificacion.INFO,
      });
    }
  }
}
