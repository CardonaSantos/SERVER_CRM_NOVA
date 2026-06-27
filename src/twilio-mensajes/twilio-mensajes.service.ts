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
import { formatearTelefonosMeta } from 'src/cloud-api-meta/helpers/cleantelefono';
// CONSTANTES PARA EL TEST
const SALDO_DISPONIBLE_REAL = 30.0;
const COSTO_ESTIMADO_MSG = 0.08;

@Injectable()
export class TwilioMensajesService {
  private readonly logger = new Logger(TwilioMensajesService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper para barajar arrays (Fisher-Yates Shuffle)
   */
  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async sendPromocion() {
    try {
      const TEMPLATE_SID = this.configService.get<string>(
        'promocion_productos',
      );
      if (!TEMPLATE_SID)
        throw new InternalServerErrorException(
          '❌ SID de plantilla no configurado',
        );

      this.logger.log('🚀 INICIANDO CAMPAÑA DE MARKETING (PRODUCCIÓN) 🚀');

      // 1. CÁLCULO DE CAPACIDAD
      const capacidadMaxima = Math.floor(
        SALDO_DISPONIBLE_REAL / COSTO_ESTIMADO_MSG,
      );
      this.logger.log(
        `💰 Presupuesto: $${SALDO_DISPONIBLE_REAL} | Capacidad Máxima: ${capacidadMaxima} envíos.`,
      );

      // 2. OBTENER PRIORITARIOS (San Antonio Huista)
      const clientesSanAntonio = await this.prisma.clienteInternet.findMany({
        where: {
          municipio: { nombre: 'San Antonio Huista' }, // ¡Verifica que el nombre sea exacto en DB!
          telefono: { not: null },
        },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          municipio: { select: { nombre: true } },
        },
      });

      const totalSanAntonio = clientesSanAntonio.length;
      let cupoRestante = capacidadMaxima - totalSanAntonio;

      this.logger.log(`📍 San Antonio Huista: ${totalSanAntonio} clientes.`);

      if (cupoRestante < 0) {
        this.logger.warn(
          `⚠️ San Antonio excede el presupuesto. Se enviará hasta agotar saldo.`,
        );
        cupoRestante = 0;
      }

      // 3. OBTENER Y BARAJAR SECUNDARIOS (Jacaltenango)
      let seleccionadosJacal = [];
      if (cupoRestante > 0) {
        const todosJacaltenango = await this.prisma.clienteInternet.findMany({
          where: {
            municipio: { nombre: 'Jacaltenango' },
            telefono: { not: null },
          },
          select: {
            id: true,
            nombre: true,
            telefono: true,
            municipio: { select: { nombre: true } },
          },
        });

        // Barajar para aleatoriedad democrática
        const jacalBarajado = this.shuffleArray([...todosJacaltenango]);
        seleccionadosJacal = jacalBarajado.slice(0, cupoRestante);

        this.logger.log(
          `🎲 Jacaltenango: ${seleccionadosJacal.length} clientes seleccionados al azar.`,
        );
      }

      // 4. UNIFICAR LISTA FINAL
      let listaEnvio = [...clientesSanAntonio, ...seleccionadosJacal];

      // Recorte de seguridad inicial
      if (listaEnvio.length > capacidadMaxima) {
        listaEnvio = listaEnvio.slice(0, capacidadMaxima);
      }

      const stats = {
        totalObjetivo: listaEnvio.length,
        enviadosOk: 0,
        enviadosFallidos: 0,
        costoEstimadoFinal: 0,
      };

      this.logger.log(`📨 PROCESANDO ${stats.totalObjetivo} ENVÍOS...`);

      // 5. BUCLE DE ENVÍO CON FRENO DE EMERGENCIA
      for (const [index, cliente] of listaEnvio.entries()) {
        // --- 🛑 FRENO DE EMERGENCIA 🛑 ---
        if (
          stats.costoEstimadoFinal + COSTO_ESTIMADO_MSG >
          SALDO_DISPONIBLE_REAL
        ) {
          this.logger.warn(
            `🛑 PRESUPUESTO ALCANZADO ($${stats.costoEstimadoFinal.toFixed(2)}). Deteniendo proceso.`,
          );
          break;
        }

        // --- 🛠️ USO DE TU FUNCIÓN UTILITARIA ---
        // Esto limpia espacios, agrega +502 y el prefijo whatsapp:
        const destinosValidos = formatearTelefonosMeta([cliente.telefono]);

        if (destinosValidos.length === 0) {
          this.logger.warn(
            `⚠️ Cliente ${cliente.id} (${cliente.nombre}) número inválido. Saltando.`,
          );
          continue;
        }

        // Tomamos el primer número válido (formato: "whatsapp:+502...")
        const numeroDestino = destinosValidos[0];

        try {
          await this.twilioService.sendWhatsAppTemplate(
            numeroDestino,
            TEMPLATE_SID,
            {
              // Variable {{1}} con el primer nombre
              1: cliente.nombre.trim().split(' ')[0],
            },
          );

          stats.enviadosOk++;
          stats.costoEstimadoFinal += COSTO_ESTIMADO_MSG;

          // Logs periódicos para no saturar consola
          if (stats.enviadosOk % 10 === 0) {
            this.logger.log(
              `✅ Avance: ${stats.enviadosOk}/${stats.totalObjetivo} ($${stats.costoEstimadoFinal.toFixed(2)})`,
            );
          }

          // Pausa ligera para cuidar la API
          await new Promise((r) => setTimeout(r, 100));
        } catch (error) {
          stats.enviadosFallidos++;
          this.logger.error(`❌ Error con ${cliente.nombre}: ${error}`);
        }
      }

      this.logger.log(
        `🏁 CAMPAÑA FINALIZADA. Éxitos: ${stats.enviadosOk} | Fallos: ${stats.enviadosFallidos} | Costo Final: $${stats.costoEstimadoFinal.toFixed(2)}`,
      );

      return stats;
    } catch (error) {
      this.logger.error('🔥 Error crítico en campaña masiva', error);
      throw new InternalServerErrorException(
        'Fallo en proceso de envío masivo',
      );
    }
  }
}
