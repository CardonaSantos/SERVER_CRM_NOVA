import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { FacturaManagerService } from '../factura-manager/factura-manager.service';
import { shouldSkipClient, shouldSkipZoneToday } from '../Functions';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
import { formatearTelefonosMeta } from 'src/cloud-api-meta/helpers/cleantelefono';
import { NotificacionesService } from 'src/notificaciones/app/notificaciones.service';
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class SegundoRecordatorioCronService {
  private readonly logger = new Logger(SegundoRecordatorioCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly facturaManager: FacturaManagerService,
    private readonly cloudApi: CloudApiMetaService,

    private readonly notificationSystemService: NotificacionesService,
  ) {}

  @Cron('0 10 * * *', { timeZone: 'America/Guatemala' })
  // @Cron(CronExpression.EVERY_MINUTE)
  async generarMensajeSegundoRecordatorio(): Promise<void> {
    this.logger.debug('Verificando zonas de facturación: Recordatorio 2');

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
    if (!empresa) return;

    const zonas = await this.prisma.facturacionZona.findMany({
      include: { clientes: { include: { servicioInternet: true } } },
    });

    for (const zona of zonas) {
      if (shouldSkipZoneToday(zona.diaSegundoRecordatorio)) continue;
      if (!(zona.enviarRecordatorio && zona.enviarRecordatorio2)) continue;

      this.logger.log(
        `--- Iniciando envío de Recordatorio 2 para Zona: ${zona.nombre} ---`,
      );

      // 1. INICIALIZAMOS EL CONTADOR PARA ESTA ZONA
      let contador = {
        clientesOperados: 0,
        clientesRecordados: 0,
        clientesOmitidos: 0,
        erroresCriticos: 0,
      };

      for (const cliente of zona.clientes) {
        if (shouldSkipClient(cliente.estadoCliente, cliente.servicioInternet))
          continue;

        // Sumamos a operados una vez que pasa el filtro general
        contador.clientesOperados++;

        if (!cliente.enviarRecordatorio) {
          this.logger.debug(
            `Cliente ${cliente.id} tiene enviarRecordatorio=false; no se envía Recordatorio 2.`,
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

          const mesFactura = dayjs(factura.fechaPagoEsperada)
            .tz('America/Guatemala')
            .locale('es')
            .format('MMMM YYYY')
            .toUpperCase();

          const destinos = Array.from(
            new Set(formatearTelefonosMeta([cliente.telefono])),
          );

          if (destinos.length === 0) {
            this.logger.warn(
              `Cliente ${cliente.id} sin teléfonos válidos para Meta. Raw: "${cliente.telefono}"`,
            );
            contador.clientesOmitidos++;
            continue;
          }

          const variablesPlantilla = [
            `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
              'Nombre no disponible', // {{1}}
            empresa.nombre ?? 'Nova Sistemas S.A.', // {{2}}
            mesFactura, // {{3}}
          ];

          let envioExitoso = false;

          for (const tel of destinos) {
            const payload = this.cloudApi.crearPayloadTicket(
              tel,
              TEMPLATE_NAME,
              variablesPlantilla,
            );
            const resp = await this.cloudApi.enviarMensaje(payload);
            const msgId = resp?.messages?.[0]?.id;

            this.logger.log(
              `📨 Recordatorio 2 enviado a ${tel} (cliente ${cliente.id})${msgId ? ` (msgId: ${msgId})` : ''}`,
            );

            if (msgId) envioExitoso = true;
          }

          if (envioExitoso) {
            contador.clientesRecordados++;
          } else {
            contador.erroresCriticos++;
          }
        } catch (error: any) {
          // Si es NotFoundException (no tiene factura), cuenta como omitido, no como error crítico
          if (error instanceof NotFoundException) {
            this.logger.debug(
              `Sin factura para cliente ${cliente.id}; no se envía recordatorio.`,
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

      // 2. CREAR LA NOTIFICACIÓN DEL RESUMEN AL FINALIZAR LA ZONA
      this.logger.log(
        `    |2|Resumen Recordatorio 2 Zona ${zona.nombre} (ID: ${zona.id}):\n` +
          `   - Total Operados: ${contador.clientesOperados}\n` +
          `   - WhatsApp Enviados: ${contador.clientesRecordados}\n` +
          `   - Omitidos (Pagados/Config/Sin Num): ${contador.clientesOmitidos}\n` +
          `   - Errores Críticos: ${contador.erroresCriticos}`,
      );

      await this.notificationSystemService.create({
        mensaje: `El servicio de recordatorios (Aviso 2) ha trabajado la zona: ${zona.nombre} y ha generado lo siguiente:
                  Clientes operados: ${contador.clientesOperados}
                  Recordatorios enviados: ${contador.clientesRecordados}
                  Omitidos (Sin deuda o apagados): ${contador.clientesOmitidos}
                  Errores Criticos: ${contador.erroresCriticos}
        `,
        audiencia: 'GLOBAL',
        categoria: 'FACTURACION',
        titulo: 'Segundo Recordatorio de Pago',
        subtipo: 'CRON JOB',
        referenciaTipo: 'FACTURACION_ZONA',
        referenciaId: zona.id,
        severidad: 'INFO',
        empresaId: zona.empresaId,
      });
    }
  }
}
