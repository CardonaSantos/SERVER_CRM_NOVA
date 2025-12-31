import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteInternet, FacturaInternet } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { shouldSkipClient, shouldSkipZoneToday } from '../Functions';
import { FacturaManagerService } from '../factura-manager/factura-manager.service';
import { formatearTelefonosMeta } from 'src/cloud-api-meta/helpers/cleantelefono';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
// CONFIG DE DAYJS
import * as dayjs from 'dayjs';
import 'dayjs/locale/es';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import { NotificacionesService } from 'src/notificaciones/app/notificaciones.service';
import { Notificacion } from 'src/notificaciones/entities/notificacione.entity';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('es');

@Injectable()
export class GeneracionFacturaCronService {
  private readonly logger = new Logger(GeneracionFacturaCronService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly facturaManager: FacturaManagerService,
    private readonly cloudApi: CloudApiMetaService,

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
      include: { clientes: { include: { servicioInternet: true } } },
    });

    for (const zona of zonas) {
      if (shouldSkipZoneToday(zona.diaGeneracionFactura)) continue;
      this.logger.log(
        `--- Iniciando facturación para Zona: ${zona.nombre} ---`,
      );
      let contador = {
        clientesOperados: 0, // Clientes totales revisados en la zona
        clientesFacturaGenerada: 0, // Facturas creadas (nuevas o existentes detectadas)
        clientesRecordados: 0, // WhatsApp enviado exitosamente (200 de Meta)
        clientesNoRecordados: 0, // Fallo envío o configuración desactivada
        erroresCriticos: 0, // Fallos de BD
      };

      for (const cliente of zona.clientes) {
        if (shouldSkipClient(cliente.estadoCliente, cliente.servicioInternet))
          continue;

        contador.clientesOperados++;

        if (!cliente.enviarRecordatorio) {
          this.logger.debug(
            `Cliente ${cliente.id} tiene enviarRecordatorio=false; no se envía notificación de factura.`,
          );
          contador.clientesNoRecordados++;
          continue;
        }

        try {
          const { factura, notificar } =
            await this.facturaManager.CrearFacturaCronMain(cliente, zona);

          await this.facturaManager.actualizarEstadoCliente(factura);
          contador.clientesFacturaGenerada++;
          if (notificar) {
            try {
              await this.enviarWhatsAppFacturaMeta(
                cliente,
                factura,
                TEMPLATE_NAME,
              );
              contador.clientesRecordados++;
            } catch (notifyError: any) {
              this.logger.error(
                `Fallo WhatsApp Cliente ${cliente.id}: ${notifyError.message}`,
              );
              contador.clientesNoRecordados++;
            }
          } else {
            this.logger.debug(
              `Factura ${factura.id} ya pagada; no se envía notificación.`,
            );
          }
        } catch (err: any) {
          this.logger.warn(
            `CRÍTICO Zona ${zona.id} cliente ${cliente.id}: ${err?.message ?? err}`,
          );
          contador.erroresCriticos++;
        }
      }
      // CREAR LA NOTIFICACION
      this.logger.log(
        `    |1|Resumen Zona ${zona.nombre} (ID: ${zona.id}):\n` +
          `   - Total Operados: ${contador.clientesOperados}\n` +
          `   - Facturas Gestionadas: ${contador.clientesFacturaGenerada}\n` +
          `   - WhatsApp Enviados (Meta OK): ${contador.clientesRecordados}\n` +
          `   - No Notificados (Config/Error): ${contador.clientesNoRecordados}\n` +
          `   - Errores Críticos: ${contador.erroresCriticos}`,
      );

      await this.notificationSystemService.create({
        mensaje: `El servicio de facturación ha trabajado la zona: ${zona.nombre} y ha generado lo siguiente:
                  Clientes operados: ${contador.clientesOperados}
                  Facturas generadas: ${contador.clientesFacturaGenerada}
                  Clientes no recordados: ${contador.clientesNoRecordados}
                  Clientes notificados: ${contador.clientesRecordados}
                  Errores Criticos: ${contador.erroresCriticos}
        `,
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

  private async enviarWhatsAppFacturaMeta(
    cliente: ClienteInternet,
    factura: FacturaInternet,
    templateName: string,
  ): Promise<void> {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: cliente.empresaId },
      select: { nombre: true },
    });

    const mesFactura = dayjs(factura.fechaPagoEsperada)
      .tz('America/Guatemala')
      .format('MMMM YYYY')
      .toUpperCase();

    const telefonos = formatearTelefonosMeta([cliente.telefono]);
    const destinosUnicos = Array.from(new Set(telefonos));

    if (destinosUnicos.length === 0) {
      this.logger.warn(
        `Cliente ${cliente.id} sin teléfono válido para Meta. Raw: "${cliente.telefono}"`,
      );
      return;
    }

    const variablesPlantilla = [
      `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
        'Nombre no disponible', // {{1}}
      empresa?.nombre ?? 'Nova Sistemas S.A.', // {{2}}
      mesFactura, // {{3}}
    ];

    for (const tel of destinosUnicos) {
      const payload = this.cloudApi.crearPayloadTicket(
        tel,
        templateName,
        variablesPlantilla,
      );

      const resp = await this.cloudApi.enviarMensaje(payload);
      const msgId = resp?.messages?.[0]?.id;

      this.logger.log(
        `Factura notificada a ${tel}${msgId ? ` (msgId: ${msgId})` : ''}`,
      );
    }
  }
}

// private async actualizarEstadoCliente(
//   factura: FacturaInternet,
// ): Promise<void> {
//   const pendientes = await this.prisma.facturaInternet.count({
//     where: {
//       clienteId: factura.clienteId,
//       estadoFacturaInternet: { in: PENDIENTES_ENUM },
//     },
//   });

//   await this.prisma.clienteInternet.update({
//     where: { id: factura.clienteId },
//     data: { estadoCliente: getEstadoCliente(pendientes) },
//   });
// }
