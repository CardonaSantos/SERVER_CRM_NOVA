import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';

import {
  EnviadorPushPort,
  MensajePush,
  ResultadoEnvioPush,
} from '../../application/ports/enviador-push.port';

const NOMBRE_APP = 'nova-crm-push';
const MAXIMO_POR_LOTE = 500;

const CODIGOS_TOKEN_INVALIDO = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

/**
 * Firebase Cloud Messaging. Se inicializa en el primer envío: si faltan las
 * credenciales la aplicación arranca igual y el push queda desactivado.
 * Nunca registra tokens, credenciales ni el cuerpo del mensaje.
 */
@Injectable()
export class EnviadorPushFirebaseAdapter implements EnviadorPushPort {
  private readonly logger = new Logger(EnviadorPushFirebaseAdapter.name);

  private app: App | null | undefined;

  constructor(private readonly config: ConfigService) {}

  disponible(): boolean {
    return this.obtenerApp() !== null;
  }

  async enviar(mensaje: MensajePush): Promise<ResultadoEnvioPush> {
    const app = this.obtenerApp();
    const resultado: ResultadoEnvioPush = {
      exitosos: 0,
      fallidos: 0,
      tokensInvalidos: [],
    };

    if (!app) {
      resultado.fallidos = mensaje.tokens.length;
      return resultado;
    }

    const messaging = getMessaging(app);

    for (let i = 0; i < mensaje.tokens.length; i += MAXIMO_POR_LOTE) {
      const lote = mensaje.tokens.slice(i, i + MAXIMO_POR_LOTE);

      try {
        const respuesta = await messaging.sendEachForMulticast(
          this.construir(mensaje, lote),
        );

        resultado.exitosos += respuesta.successCount;
        resultado.fallidos += respuesta.failureCount;

        respuesta.responses.forEach((r, indice) => {
          const codigo = r.error?.code;

          if (r.success) return;
          if (codigo && CODIGOS_TOKEN_INVALIDO.has(codigo)) {
            resultado.tokensInvalidos.push(lote[indice]);
          }

          this.logger.warn(`FCM rechazó un envío (${codigo ?? 'sin código'}).`);
        });
      } catch (error) {
        // Una caída de FCM nunca deshace lo que ya se guardó.
        resultado.fallidos += lote.length;
        this.logger.error(
          `Falló un lote de ${lote.length} push.`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return resultado;
  }

  private construir(m: MensajePush, tokens: string[]): MulticastMessage {
    return {
      tokens,
      notification: { title: m.titulo, body: m.cuerpo },
      data: Object.fromEntries(
        Object.entries(m.datos).map(([clave, valor]) => [clave, String(valor)]),
      ),
      android: {
        priority: 'high',
        ttl: m.vigenciaMs,
        collapseKey: m.claveAgrupacion,
        notification: {
          channelId: m.canal,
          // En Android 8+ el canal decide el sonido; esto lo apaga si el usuario lo pidió.
          sound: m.sonido ? 'default' : undefined,
          visibility: 'private',
        },
      },
    };
  }

  private obtenerApp(): App | null {
    if (this.app !== undefined) return this.app;

    const existente = getApps().find((app) => app.name === NOMBRE_APP);

    if (existente) {
      this.app = existente;
      return existente;
    }

    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID')?.trim();
    const clientEmail = this.config
      .get<string>('FIREBASE_CLIENT_EMAIL')
      ?.trim();
    const clave = this.config.get<string>('FIREBASE_PRIVATE_KEY')?.trim();

    if (!projectId || !clientEmail || !clave) {
      this.logger.error(
        'Faltan credenciales de Firebase: el push está desactivado.',
      );
      this.app = null;
      return null;
    }

    try {
      this.app = initializeApp(
        {
          // Railway guarda los saltos de línea del PEM como "\n".
          credential: cert({
            projectId,
            clientEmail,
            privateKey: clave.replace(/\\n/g, '\n'),
          }),
          projectId,
        },
        NOMBRE_APP,
      );
      this.logger.log('Firebase inicializado para push.');
    } catch (error) {
      this.logger.error(
        'No se pudo inicializar Firebase: el push está desactivado.',
        error instanceof Error ? error.stack : undefined,
      );
      this.app = null;
    }

    return this.app;
  }
}
