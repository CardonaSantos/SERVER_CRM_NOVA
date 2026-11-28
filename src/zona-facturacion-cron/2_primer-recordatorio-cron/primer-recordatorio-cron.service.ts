import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
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
  ContextoEtapaJornada,
  ContextoTareaProgramada,
  TAREAS_PROGRAMADAS,
  TareasProgramadasPort,
} from 'src/modules/tareas-programadas/public/tareas-programadas.facade.port';
import { FaseJornada } from 'src/modules/tareas-programadas/public/tareas-programadas.types';

import {
  CLIENTE_FACTURABLE_WHERE,
  ESTADOS_FACTURA_PENDIENTE,
  clavePasoZona,
  codigoErrorCron,
  shouldSkipZoneToday,
} from '../helpers/Functions';
import { FacturacionUtilitiesService } from '../utilities/factura-manager.service';

const TAREA = 'ENVIAR_RECORDATORIO_1';

@Injectable()
export class PrimerRecordatorioCronService implements OnModuleInit {
  private readonly logger = new Logger(PrimerRecordatorioCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly facturacionServices: FacturacionUtilitiesService,
    @Inject(NOTIFICACION)
    private readonly notificaciones: NotificacionFacadePort,
    @Inject(TAREAS_PROGRAMADAS)
    private readonly tareas: TareasProgramadasPort,
  ) {}

  /** Etapa de la jornada de las 10:00, después de la generación (antes, su propio cron). */
  onModuleInit(): void {
    this.tareas.registrarEtapa({
      tarea: TAREA,
      fase: FaseJornada.FACTURACION,
      orden: 30,
      ejecutar: (etapa) => this.generarMensajePrimerRecordatorio(etapa),
    });
  }

  async generarMensajePrimerRecordatorio(
    etapa: ContextoEtapaJornada,
  ): Promise<void> {
    this.logger.debug('Verificando zonas de facturación: Recordatorio 1');

    const TEMPLATE_NAME =
      this.configService.get<string>('RECORDATORIO_FACTURA_PLANTILLA') ??
      (() => {
        throw new InternalServerErrorException(
          'Nombre de plantilla faltante: RECORDATORIO_FACTURA_PLANTILLA',
        );
      })();

    const zonas = await this.prisma.facturacionZona.findMany({
      where: { eliminadoEn: null },
      select: {
        id: true,
        diaRecordatorio: true,
        enviarRecordatorio: true,
        enviarRecordatorio1: true,
      },
    });

    for (const zona of zonas) {
      if (shouldSkipZoneToday(zona.diaRecordatorio)) continue;

      const zonaPermiteRecordatorio =
        zona.enviarRecordatorio && zona.enviarRecordatorio1; // && zona.whatsapp;

      if (!zonaPermiteRecordatorio) {
        this.logger.debug(
          `Zona ${zona.id} no permite Recordatorio 1; se omite.`,
        );
        continue;
      }

      await etapa.ejecutarPaso({
        clave: clavePasoZona(TAREA, zona.id, etapa.fechaOperativa),
        tarea: TAREA,
        facturacionZonaId: zona.id,
        // Repetirla reenviaría el recordatorio a quien ya lo recibió.
        reintentable: false,
        trabajo: (paso) => this.recordarZona(zona.id, TEMPLATE_NAME, paso),
      });
    }
  }

  private async recordarZona(
    zonaId: number,
    TEMPLATE_NAME: string,
    paso: ContextoTareaProgramada,
  ): Promise<void> {
    const zona = await this.prisma.facturacionZona.findFirst({
      where: { id: zonaId, eliminadoEn: null },
      include: {
        clientes: {
          where: CLIENTE_FACTURABLE_WHERE,
          select: {
            id: true,
          },
        },
      },
    });
    if (!zona) return;

    this.logger.log(
      `--- Iniciando Recordatorio 1 para Zona: ${zona.nombre} (${zona.id}) ---`,
    );

    const contador = {
      clientesOperados: 0,
      clientesRecordados: 0,
      clientesOmitidos: 0,
      erroresCriticos: 0,
    };

    for (const cliente of zona.clientes) {
      contador.clientesOperados++;
      paso.contarProcesados();

      try {
        /**
         * Recordatorio 1 NO crea factura.
         * Solo busca la factura existente del periodo.
         */
        const { factura } = await this.facturacionServices.obtenerOcrearFactura(
          cliente.id,
          zona,
          false,
        );

        const facturaRequiereRecordatorio = ESTADOS_FACTURA_PENDIENTE.includes(
          factura.estadoFacturaInternet,
        );

        if (!facturaRequiereRecordatorio) {
          this.logger.debug(
            `Factura ${factura.id} no requiere Recordatorio 1. Estado: ${factura.estadoFacturaInternet}`,
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
      } catch (err: any) {
        if (err instanceof NotFoundException) {
          this.logger.debug(
            `Cliente ${cliente.id} sin factura del periodo; no se envía Recordatorio 1.`,
          );
          contador.clientesOmitidos++;
          continue;
        }

        this.logger.warn(
          `Zona ${zona.id} cliente ${cliente.id}: ${err?.message ?? err}`,
        );
        contador.erroresCriticos++;
        paso.registrarError(`cliente-${cliente.id}`, codigoErrorCron(err));
      }
    }

    paso.anotar('clientesRecordados', contador.clientesRecordados);
    paso.anotar('clientesOmitidos', contador.clientesOmitidos);

    this.logger.log(
      `Resumen Recordatorio 1 Zona ${zona.nombre} (${zona.id}): ` +
        `operados=${contador.clientesOperados}, ` +
        `recordados=${contador.clientesRecordados}, ` +
        `omitidos=${contador.clientesOmitidos}, ` +
        `errores=${contador.erroresCriticos}`,
    );

    await this.notificaciones.notificar({
      mensaje: `El servicio de recordatorios (Aviso 1) ha trabajado la zona: ${zona.nombre} y ha generado lo siguiente:
Clientes operados: ${contador.clientesOperados}
Recordatorios enviados: ${contador.clientesRecordados}
Omitidos: ${contador.clientesOmitidos}
Errores críticos: ${contador.erroresCriticos}`,
      destino: { roles: ROLES_SIN_TECNICO },
      categoria: CategoriaNotificacion.COBRANZA,
      titulo: 'Primer Recordatorio de Pago',
      subtipo: 'CRON JOB',
      referencia: { tipo: 'FACTURACION_ZONA', id: zona.id },
      severidad: SeveridadNotificacion.INFO,
    });
  }
}
