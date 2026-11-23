import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configurarSwagger } from './swagger/configurar-swagger';

const port = process.env.PORT || 3000;

async function bootstrap() {
  // rawBody: el webhook de Meta firma los bytes exactos del body (HMAC).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  /*
   * Cabeceras de seguridad nativas de Nest 12 (mismos defaults que Helmet 8,
   * que reemplaza). Debe llamarse antes de listen(). CORP en cross-origin:
   * el front vive en otro dominio y carga medios servidos por la API
   * (p. ej. twilio-api).
   */
  app.useSecurityHeaders({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  /*
   * Railway pone un proxy delante: sin esto req.ip es la IP del proxy y el
   * throttler limitaría a todos los clientes como si fueran uno solo.
   * 1 = confiar solo en el primer salto (el proxy de Railway).
   */
  app.set('trust proxy', 1);

  /*
   * Express 5 (Nest 11) cambió el parser por defecto a 'simple', que no
   * entiende `zonas[]=1&zonas[]=2` (formato de arreglos de axios) ni objetos
   * anidados. 'extended' (qs) es el comportamiento que siempre tuvo la API.
   */
  app.set('query parser', 'extended');

  const allowlist = new Set<string>([
    'http://localhost:5173',
    'http://localhost:8081',
    'https://nova-crm-server-test-ui-production.up.railway.app',
    'https://pos-crm-nova.up.railway.app',
  ]);

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) {
        return cb(null, true);
      }

      return cb(null, allowlist.has(origin));
    },

    credentials: true,

    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
    ],

    exposedHeaders: ['Set-Cookie'],

    preflightContinue: false,

    optionsSuccessStatus: 204,
  });

  // Solo si SWAGGER_HABILITADO=true (apagado por omisión).
  configurarSwagger(app);

  await app.listen(port);
}

bootstrap();
