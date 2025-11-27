import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateTwilioMensajeDto } from './dto/create-twilio-mensaje.dto';
import { UpdateTwilioMensajeDto } from './dto/update-twilio-mensaje.dto';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from 'src/twilio/twilio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { formatearTelefonos } from 'src/zona-facturacion-cron/Functions';

@Injectable()
export class TwilioMensajesService {
  private readonly logger = new Logger(TwilioMensajesService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly configService: ConfigService,
  ) {}

  async sendPromocion() {
    try {
      const TEMPLATE_SID = this.configService.get<string>('TWILIO_PROMOCION');
      if (!TEMPLATE_SID) {
        throw new InternalServerErrorException(
          'SID de plantilla TWILIO_PROMOCION faltante',
        );
      }

      const clientes = await this.prisma.clienteInternet.findMany({
        where: {
          estadoCliente: {
            in: [
              'ACTIVO',
              'ATRASADO',
              'MOROSO',
              'PAGO_PENDIENTE',
              'SUSPENDIDO',
              'PENDIENTE_ACTIVO',
            ],
          },
        },
        select: {
          id: true,
          nombre: true,
          telefono: true,
        },
      });

      const stats = {
        totalClientes: clientes.length,
        totalDestinos: 0,
        enviadosOk: 0,
        enviadosFallidos: 0,
        clientesSinTelefono: 0,
      };

      this.logger.log(
        `Iniciando campaña de promoción. Clientes a procesar: ${stats.totalClientes}`,
      );

      for (const cliente of clientes) {
        const destinos = formatearTelefonos([cliente.telefono]);

        if (!destinos.length) {
          stats.clientesSinTelefono++;
          this.logger.debug(
            `Cliente ${cliente.id} sin teléfonos válidos; se omite.`,
          );
          continue;
        }

        for (const numero of destinos) {
          stats.totalDestinos++;

          try {
            await this.twilioService.sendWhatsAppTemplate(
              numero,
              TEMPLATE_SID,
              {},
            );

            stats.enviadosOk++;
            this.logger.log(
              `📨 Promoción enviada a ${numero} (cliente ${cliente.id})`,
            );
          } catch (err) {
            stats.enviadosFallidos++;
            this.logger.warn(
              `❌ Error enviando promo a ${numero} (cliente ${cliente.id}): ${
                (err as any)?.message ?? err
              }`,
            );
          }
        }
      }

      this.logger.log(
        `Campaña finalizada. Clientes: ${stats.totalClientes}, destinos: ${stats.totalDestinos}, OK: ${stats.enviadosOk}, Fallidos: ${stats.enviadosFallidos}, Sin teléfono: ${stats.clientesSinTelefono}`,
      );

      // Puedes devolverlo a un controller si quieres ver el resumen en la UI
      return stats;
    } catch (error) {
      await throwFatalError(
        error,
        this.logger,
        'Twilio - enviar promoción masiva',
      );
    }
  }
}
