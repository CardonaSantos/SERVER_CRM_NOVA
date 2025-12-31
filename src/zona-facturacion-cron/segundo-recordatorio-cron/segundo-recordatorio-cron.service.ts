import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { FacturaManagerService } from '../factura-manager/factura-manager.service';
import { shouldSkipClient, shouldSkipZoneToday } from '../Functions';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
import { formatearTelefonosMeta } from 'src/cloud-api-meta/helpers/cleantelefono';
// Extiende dayjs con los plugins
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
  ) {}

  @Cron('0 10 * * *', { timeZone: 'America/Guatemala' })
  async generarMensajeSegundoRecordatorio(): Promise<void> {
    this.logger.debug('Verificando zonas de facturación: Recordatorio 2');

    const TEMPLATE_NAME =
      this.configService.get<string>('RECORDATORIO_PAGO_1_PLANTILLA') ??
      (() => {
        throw new InternalServerErrorException(
          'Nombre de plantilla faltante: RECORDATORIO_PAGO_2_PLANTILLA',
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

      for (const cliente of zona.clientes) {
        if (shouldSkipClient(cliente.estadoCliente, cliente.servicioInternet))
          continue;
        if (!cliente.enviarRecordatorio) continue;

        const { factura } = await this.facturaManager.obtenerOcrearFactura(
          cliente,
          zona,
          false,
        );

        if (
          !['PENDIENTE', 'PARCIAL', 'VENCIDA'].includes(
            factura.estadoFacturaInternet,
          )
        )
          continue;

        const mesFactura = dayjs(factura.fechaPagoEsperada)
          .tz('America/Guatemala')
          .locale('es')
          .format('MMMM YYYY')
          .toUpperCase();

        const monto = Number(factura.montoPago).toFixed(2);

        const destinos = Array.from(
          new Set(formatearTelefonosMeta([cliente.telefono])),
        );
        if (destinos.length === 0) continue;

        const variablesPlantilla = [
          `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
            'Nombre no disponible', // {{1}}
          empresa.nombre ?? 'Nova Sistemas S.A.', // {{2}}
          mesFactura, // {{3}}
        ];

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
        }
      }
    }
  }
}

// generarMensajeSegundoRecordatorio
