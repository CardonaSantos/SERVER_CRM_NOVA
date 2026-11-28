import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
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
  codigoErrorCron,
  shouldSkipZoneToday,
} from '../helpers/Functions';
import { FacturacionUtilitiesService } from '../utilities/factura-manager.service';

const TAREA = 'GENERAR_FACTURAS';

@Injectable()
export class GeneracionFacturaCronService implements OnModuleInit {
  private readonly logger = new Logger(GeneracionFacturaCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly facturacionServices: FacturacionUtilitiesService,
    @Inject(NOTIFICACION)
    private readonly notificaciones: NotificacionFacadePort,
    @Inject(TAREAS_PROGRAMADAS)
    private readonly tareas: TareasProgramadasPort,
  ) {}

  /** Primera etapa de la jornada de las 10:00 (antes, su propio cron). */
  onModuleInit(): void {
    this.tareas.registrarEtapa({
      tarea: TAREA,
      fase: FaseJornada.FACTURACION,
      orden: 10,
      ejecutar: (etapa) => this.gerarFacturacionAutomaticaCron(etapa),
    });
  }

  /** Un paso por zona cuyo día de generación es hoy; incluye el aviso de generación. */
  async gerarFacturacionAutomaticaCron(etapa: ContextoEtapaJornada) {
    const TEMPLATE_NAME =
      this.configService.get<string>('GENERACION_FACTURA_PLANTILLA') ??
      (() => {
        throw new InternalServerErrorException(
          'Nombre de plantilla faltante: GENERACION_FACTURA_PLANTILLA',
        );
      })();

    const zonas = await this.prisma.facturacionZona.findMany({
      where: { eliminadoEn: null },
      select: { id: true, diaGeneracionFactura: true },
    });

    for (const zona of zonas) {
      if (shouldSkipZoneToday(zona.diaGeneracionFactura)) continue;

      await etapa.ejecutarPaso({
        // Una por periodo (mes): así se podrá ponerse al día (guía de cobranza §4.6).
        clave: `${TAREA}:zona-${zona.id}:${etapa.fechaOperativa.slice(0, 7)}`,
        tarea: TAREA,
        facturacionZonaId: zona.id,
        // Repetirla reenviaría el aviso a quien ya lo recibió: un solo intento
        // hasta que los avisos pasen por la cola de comunicaciones.
        reintentable: false,
        trabajo: (paso) => this.generarZona(zona.id, TEMPLATE_NAME, paso),
      });
    }
  }

  private async generarZona(
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
      paso.contarProcesados();

      try {
        const { factura, notificar } =
          await this.facturacionServices.crearFacturaCronMain(cliente.id, zona);

        await this.facturacionServices.actualizarEstadoCobranzaCliente(factura);

        contador.facturasGestionadas++;

        const zonaPermiteNotificar =
          zona.enviarRecordatorio && zona.enviarRecordatorioGeneracion; // zona.whatsapp;

        if (!zonaPermiteNotificar) {
          contador.clientesNoRecordados++;
          this.logger.log('La zona no permite notificar en su configuracion');

          continue;
        }

        if (!notificar) {
          contador.clientesNoRecordados++;
          this.logger.log('No hay trigger de notificar, no se notifica');
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
        paso.registrarError(`cliente-${cliente.id}`, codigoErrorCron(err));
      }
    }

    paso.anotar('facturasGestionadas', contador.facturasGestionadas);
    paso.anotar('clientesRecordados', contador.clientesRecordados);
    paso.anotar('clientesNoRecordados', contador.clientesNoRecordados);

    this.logger.log(
      `Resumen Zona ${zona.nombre} (${zona.id}): ` +
        `operados=${contador.clientesOperados}, ` +
        `facturas=${contador.facturasGestionadas}, ` +
        `recordados=${contador.clientesRecordados}, ` +
        `noRecordados=${contador.clientesNoRecordados}, ` +
        `errores=${contador.erroresCriticos}`,
    );

    await this.notificaciones.notificar({
      mensaje: `El servicio de facturación ha trabajado la zona: ${zona.nombre} y ha generado lo siguiente:
Clientes operados: ${contador.clientesOperados}
Facturas generadas/gestionadas: ${contador.facturasGestionadas}
Clientes no recordados: ${contador.clientesNoRecordados}
Clientes notificados: ${contador.clientesRecordados}
Errores críticos: ${contador.erroresCriticos}`,
      destino: { roles: ROLES_SIN_TECNICO },
      categoria: CategoriaNotificacion.FACTURACION,
      titulo: 'Generación de Facturación',
      subtipo: 'CRON JOB',
      referencia: { tipo: 'FACTURACION_ZONA', id: zona.id },
      severidad: SeveridadNotificacion.INFO,
    });
  }
}
