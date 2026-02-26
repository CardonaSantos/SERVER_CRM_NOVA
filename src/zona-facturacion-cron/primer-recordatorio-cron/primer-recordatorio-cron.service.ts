import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from 'src/prisma/prisma.service';

import { TwilioService } from 'src/twilio/twilio.service';
import { ConfigService } from '@nestjs/config';
import { FacturaManagerService } from '../factura-manager/factura-manager.service';
import {
  formatearTelefonos,
  shouldSkipClient,
  shouldSkipZoneToday,
} from '../Functions';
// Extiende dayjs con los plugins
import * as dayjs from 'dayjs';
import 'dayjs/locale/es';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import { formatearTelefonosMeta } from 'src/cloud-api-meta/helpers/cleantelefono';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
import { NotificacionesService } from 'src/notificaciones/app/notificaciones.service';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('es');

@Injectable()
export class PrimerRecordatorioCronService {
  private readonly logger = new Logger(PrimerRecordatorioCronService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly facturaManager: FacturaManagerService,
    private readonly cloudApi: CloudApiMetaService,

    private readonly notificationSystemService: NotificacionesService,
  ) {}

  @Cron('0 10 * * *', { timeZone: 'America/Guatemala' })
  async generarMensajePrimerRecordatorio(): Promise<void> {
    this.logger.debug('Verificando zonas de facturacion: Recordatorio 1');

    const TEMPLATE_NAME =
      this.configService.get<string>('RECORDATORIO_FACTURA_PLANTILLA') ??
      (() => {
        throw new InternalServerErrorException(
          'Nombre de plantilla faltante: RECORDATORIO_FACTURA_PLANTILLA',
        );
      })();

    const empresa = await this.prisma.empresa.findFirst({
      select: { nombre: true },
    });

    if (!empresa) {
      this.logger.error('Empresa no encontrada; abortando cron.');
      return;
    }

    const zonas = await this.prisma.facturacionZona.findMany({
      include: { clientes: { include: { servicioInternet: true } } },
    });

    for (const zona of zonas) {
      if (shouldSkipZoneToday(zona.diaRecordatorio)) continue;

      if (!zona.enviarRecordatorio1 || !zona.enviarRecordatorio) continue;

      this.logger.log(
        `--- Iniciando envío de Recordatorio 1 para Zona: ${zona.nombre} ---`,
      );

      // 1. INICIALIZAMOS EL CONTADOR PARA ESTA ZONA
      let contador = {
        clientesOperados: 0, // Total de clientes evaluados
        clientesRecordados: 0, // Recordatorios enviados con éxito (Meta 200)
        clientesOmitidos: 0, // Clientes sin deuda, números inválidos o configs apagadas
        erroresCriticos: 0, // Fallos inesperados
      };

      for (const cliente of zona.clientes) {
        if (shouldSkipClient(cliente.estadoCliente, cliente.servicioInternet))
          continue;

        contador.clientesOperados++;

        if (!cliente.enviarRecordatorio) {
          this.logger.debug(
            `Cliente ${cliente.id} tiene enviarRecordatorio=false; no se envía Recordatorio 1.`,
          );
          contador.clientesOmitidos++;
          continue;
        }

        try {
          const { factura } = await this.facturaManager.obtenerOcrearFactura(
            cliente,
            zona,
            false,
          );

          /** Si la factura ya está pagada, NO enviar recordatorio */
          if (
            !['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(
              factura.estadoFacturaInternet,
            )
          ) {
            this.logger.debug(
              `Factura ${factura.id} no está pendiente; se omite cliente ${cliente.id}.`,
            );
            contador.clientesOmitidos++;
            continue;
          }

          /** 4. Variable {{3}}: mes/año en español */
          const mesFactura = dayjs(factura.fechaPagoEsperada)
            .tz('America/Guatemala')
            .locale('es')
            .format('MMMM YYYY')
            .toUpperCase();

          /** 5. Números válidos (Meta) */
          const destinos = formatearTelefonosMeta([
            cliente.telefono,
            // cliente.contactoReferenciaTelefono, //
          ]);

          const destinosUnicos = Array.from(new Set(destinos));

          if (destinosUnicos.length === 0) {
            this.logger.warn(
              `Cliente ${cliente.id} sin teléfonos válidos para Meta. Raw: "${cliente.telefono}"`,
            );
            contador.clientesOmitidos++;
            continue;
          }

          /** 6. Variables (3) en orden */
          const variablesPlantilla = [
            `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
              'Nombre no disponible', // {{1}}
            empresa.nombre ?? 'Nova Sistemas S.A.', // {{2}}
            mesFactura, // {{3}}
          ];

          let envioExitoso = false;

          for (const tel of destinosUnicos) {
            const payload = this.cloudApi.crearPayloadTicket(
              tel,
              TEMPLATE_NAME,
              variablesPlantilla,
            );

            const resp = await this.cloudApi.enviarMensaje(payload);
            const msgId = resp?.messages?.[0]?.id;

            this.logger.log(
              `📨 Recordatorio 1 enviado a ${tel} (cliente ${cliente.id})${
                msgId ? ` (msgId: ${msgId})` : ''
              }`,
            );

            if (msgId) envioExitoso = true;
          }

          if (envioExitoso) {
            contador.clientesRecordados++;
          } else {
            // Si fallaron todos los intentos de envío
            contador.erroresCriticos++;
          }
        } catch (err: any) {
          if (err instanceof NotFoundException) {
            this.logger.debug(
              `Sin factura para cliente ${cliente.id}; no se envía recordatorio.`,
            );
            contador.clientesOmitidos++;
            continue;
          }

          this.logger.warn(
            `Zona ${zona.id} cliente ${cliente.id}: ${err?.message ?? err}`,
          );
          contador.erroresCriticos++;
        }
      }

      this.logger.log(
        `    |1|Resumen Recordatorio 1 Zona ${zona.nombre} (ID: ${zona.id}):\n` +
          `   - Total Operados: ${contador.clientesOperados}\n` +
          `   - WhatsApp Enviados: ${contador.clientesRecordados}\n` +
          `   - Omitidos (Pagados/Config/Sin Num): ${contador.clientesOmitidos}\n` +
          `   - Errores Críticos: ${contador.erroresCriticos}`,
      );

      await this.notificationSystemService.create({
        mensaje: `El servicio de recordatorios (Aviso 1) ha trabajado la zona: ${zona.nombre} y ha generado lo siguiente:
                  Clientes operados: ${contador.clientesOperados}
                  Recordatorios enviados: ${contador.clientesRecordados}
                  Omitidos (Sin deuda o apagados): ${contador.clientesOmitidos}
                  Errores Criticos: ${contador.erroresCriticos}
        `,
        audiencia: 'GLOBAL',
        categoria: 'COBRANZA',
        titulo: 'Primer Recordatorio de Pago',
        subtipo: 'CRON JOB',
        referenciaTipo: 'FACTURACION_ZONA',
        referenciaId: zona.id,
        severidad: 'INFO',
        empresaId: zona.empresaId,
      });
    }
  }
}
