import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const port = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowlist = new Set<string>([
    'http://localhost:5173',
    'http://localhost:8081',
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

  await app.listen(port);
}

bootstrap();
