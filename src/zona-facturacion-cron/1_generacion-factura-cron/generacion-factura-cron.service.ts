import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificacionesService } from 'src/notificaciones/app/notificaciones.service';
import {
  CLIENTE_FACTURABLE_WHERE,
  shouldSkipZoneToday,
} from '../helpers/Functions';
import { FacturacionUtilitiesService } from '../utilities/factura-manager.service';

@Injectable()
export class GeneracionFacturaCronService {
  private readonly logger = new Logger(GeneracionFacturaCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly facturacionServices: FacturacionUtilitiesService,
    private readonly notificationSystemService: NotificacionesService,
  ) {}

  @Cron('0 10 * * *', { timeZone: 'America/Guatemala' })
  async gerarFacturacionAutomaticaCron() {
    const TEMPLATE_NAME =
      this.configService.get<string>('GENERACION_FACTURA_PLANTILLA') ??
      (() => {
        throw new InternalServerErrorException(
          'Nombre de plantilla faltante: GENERACION_FACTURA_PLANTILLA',
        );
      })();

    const zonas = await this.prisma.facturacionZona.findMany({
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
      if (shouldSkipZoneToday(zona.diaGeneracionFactura)) continue;

      this.logger.log(
        `--- Iniciando facturación para Zona: ${zona.nombre} (${zona.id}) ---`,
      );

      const contador = {
        clientesOperados: 0,
        facturasGestionadas: 0,
        clientesRecordados: 0,
        clientesNoRecordados: 0,
        erroresCriticos: 0,
      };

      for (const cliente of zona.clientes) {
        contador.clientesOperados++;

        try {
          const { factura, notificar } =
            await this.facturacionServices.crearFacturaCronMain(
              cliente.id,
              zona,
            );

          await this.facturacionServices.actualizarEstadoCobranzaCliente(
            factura,
          );

          contador.facturasGestionadas++;

          const zonaPermiteNotificar =
            zona.enviarRecordatorio &&
            zona.enviarRecordatorioGeneracion &&
            zona.whatsapp;

          if (!zonaPermiteNotificar) {
            contador.clientesNoRecordados++;
            continue;
          }

          if (!notificar) {
            contador.clientesNoRecordados++;
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
            contador.clientesNoRecordados++;
          }
        } catch (err: any) {
          this.logger.warn(
            `CRÍTICO Zona ${zona.id} cliente ${cliente.id}: ${err?.message ?? err}`,
          );
          contador.erroresCriticos++;
        }
      }

      this.logger.log(
        `Resumen Zona ${zona.nombre} (${zona.id}): ` +
          `operados=${contador.clientesOperados}, ` +
          `facturas=${contador.facturasGestionadas}, ` +
          `recordados=${contador.clientesRecordados}, ` +
          `noRecordados=${contador.clientesNoRecordados}, ` +
          `errores=${contador.erroresCriticos}`,
      );

      await this.notificationSystemService.create({
        mensaje: `El servicio de facturación ha trabajado la zona: ${zona.nombre} y ha generado lo siguiente:
Clientes operados: ${contador.clientesOperados}
Facturas generadas/gestionadas: ${contador.facturasGestionadas}
Clientes no recordados: ${contador.clientesNoRecordados}
Clientes notificados: ${contador.clientesRecordados}
Errores críticos: ${contador.erroresCriticos}`,
        audiencia: 'GLOBAL',
        categoria: 'FACTURACION',
        titulo: 'Generación de Facturación',
        subtipo: 'CRON JOB',
        referenciaTipo: 'FACTURACION_ZONA',
        referenciaId: zona.id,
        severidad: 'INFO',
        empresaId: zona.empresaId,
      });
    }
  }
}
