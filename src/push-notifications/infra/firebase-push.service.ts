import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';

import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';

import { PushDispositivosService } from '../../push-dispositivos/app/push-dispositivos.service';

const FIREBASE_APP_NAME = 'nova-crm-push';

const FCM_MAX_TARGETS_PER_REQUEST = 500;

const DEFAULT_ANDROID_CHANNEL = 'tickets';

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

export interface SendPushToUserInput {
  usuarioId: number;

  title: string;

  body: string;

  /*
   * FCM exige valores string dentro de data.
   *
   * Ejemplo:
   *
   * {
   *   type: "ticket.assignment",
   *   ticketId: "58"
   * }
   */
  data?: Record<string, string>;

  channelId?: string;

  collapseKey?: string;

  ttlMs?: number;
}

export interface SendPushToUserResult {
  skipped: boolean;

  reason: 'PUSH_DISABLED' | 'NO_DEVICES' | null;

  targets: number;

  successCount: number;

  failureCount: number;

  invalidatedCount: number;
}

@Injectable()
export class FirebasePushService {
  private readonly logger = new Logger(FirebasePushService.name);

  private readonly firebaseApp: App;

  constructor(
    private readonly configService: ConfigService,

    private readonly pushDispositivosService: PushDispositivosService,
  ) {
    this.firebaseApp = this.initializeFirebase();
  }

  /*
   * =======================================================
   * FIREBASE INITIALIZATION
   * =======================================================
   */

  private initializeFirebase(): App {
    const existing = getApps().find((app) => app.name === FIREBASE_APP_NAME);

    if (existing) {
      return existing;
    }

    const projectId = this.requireConfig('FIREBASE_PROJECT_ID');

    const clientEmail = this.requireConfig('FIREBASE_CLIENT_EMAIL');

    const rawPrivateKey = this.requireConfig('FIREBASE_PRIVATE_KEY');

    /*
     * Railway/.env normalmente almacenará los saltos de
     * línea como "\n".
     *
     * Firebase necesita saltos reales dentro del PEM.
     */
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

    const app = initializeApp(
      {
        credential: cert({
          projectId,

          clientEmail,

          privateKey,
        }),

        projectId,
      },

      FIREBASE_APP_NAME,
    );

    this.logger.log(`Firebase Admin inicializado | projectId=${projectId}`);

    return app;
  }

  /*
   * =======================================================
   * SEND
   * =======================================================
   */

  async sendToUser(input: SendPushToUserInput): Promise<SendPushToUserResult> {
    const preferences =
      await this.pushDispositivosService.obtenerPreferenciasUsuario(
        input.usuarioId,
      );

    if (!preferences.notificarPush) {
      return {
        skipped: true,

        reason: 'PUSH_DISABLED',

        targets: 0,

        successCount: 0,

        failureCount: 0,

        invalidatedCount: 0,
      };
    }

    const tokens =
      await this.pushDispositivosService.obtenerTokensActivosPorUsuario(
        input.usuarioId,
      );

    if (tokens.length === 0) {
      return {
        skipped: true,

        reason: 'NO_DEVICES',

        targets: 0,

        successCount: 0,

        failureCount: 0,

        invalidatedCount: 0,
      };
    }

    const batches = this.chunk(tokens, FCM_MAX_TARGETS_PER_REQUEST);

    let successCount = 0;

    let failureCount = 0;

    const invalidTokens: string[] = [];

    const messaging = getMessaging(this.firebaseApp);

    for (const batch of batches) {
      const message: MulticastMessage = {
        tokens: batch,

        notification: {
          title: input.title,

          body: input.body,
        },

        data: this.normalizeData(input.data),

        android: {
          priority: 'high',

          ttl: input.ttlMs ?? DEFAULT_TTL_MS,

          collapseKey: input.collapseKey,

          notification: {
            channelId: input.channelId ?? DEFAULT_ANDROID_CHANNEL,

            /*
             * En Android 8+ el Notification Channel
             * tiene la última palabra sobre el sonido.
             *
             * El canal "tickets" del APK será el canal
             * audible principal.
             */
            sound: preferences.notificarSonido ? 'default' : undefined,

            visibility: 'private',
          },
        },
      };

      try {
        const response = await messaging.sendEachForMulticast(message);

        successCount += response.successCount;

        failureCount += response.failureCount;

        response.responses.forEach((result, index) => {
          if (result.success) {
            return;
          }

          const code = result.error?.code;

          if (code && INVALID_TOKEN_CODES.has(code)) {
            const token = batch[index];

            if (token) {
              invalidTokens.push(token);
            }
          }

          /*
           * No imprimimos:
           *
           * - token
           * - credentials
           * - body completo
           */
          this.logger.warn(
            [
              'FCM delivery failed',
              `usuarioId=${input.usuarioId}`,
              `code=${code ?? 'unknown'}`,
            ].join(' | '),
          );
        });
      } catch (error) {
        /*
         * Una caída de FCM NO debe poder revertir una
         * asignación de ticket ya persistida.
         *
         * Registramos el error y continuamos.
         */
        failureCount += batch.length;

        this.logger.error(
          [
            'FCM batch failed',
            `usuarioId=${input.usuarioId}`,
            `targets=${batch.length}`,
          ].join(' | '),

          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    const uniqueInvalidTokens = [...new Set(invalidTokens)];

    const invalidatedCount =
      await this.pushDispositivosService.desactivarTokensInvalidos(
        uniqueInvalidTokens,
      );

    this.logger.log(
      [
        'Push procesado',
        `usuarioId=${input.usuarioId}`,
        `targets=${tokens.length}`,
        `success=${successCount}`,
        `failed=${failureCount}`,
        `invalidated=${invalidatedCount}`,
      ].join(' | '),
    );

    return {
      skipped: false,

      reason: null,

      targets: tokens.length,

      successCount,

      failureCount,

      invalidatedCount,
    };
  }

  /*
   * =======================================================
   * HELPERS
   * =======================================================
   */

  private requireConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      throw new Error(`Firebase Push requiere la variable ${key}.`);
    }

    return value;
  }

  private normalizeData(
    data: Record<string, string> | undefined,
  ): Record<string, string> {
    if (!data) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)]),
    );
  }

  private chunk<T>(values: readonly T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let index = 0; index < values.length; index += size) {
      chunks.push(values.slice(index, index + size));
    }

    return chunks;
  }
}
