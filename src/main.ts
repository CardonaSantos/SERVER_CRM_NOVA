import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const port = process.env.PORT || 3000;

//importar algo aqui VERGA-error
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Habilitar CORS correctamente
  const allowlist = new Set<string>([
    'http://localhost:5173',
    'http://localhost:5174',
    'https://pos-crm-nova.up.railway.app', // 👈 verifica que sea EXACTO
    'https://pos-crm-nova-production.up.railway.app', // si aplica
  ]);

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/Postman sin Origin
      return cb(null, allowlist.has(origin));
    },
    credentials: true, // con cookies
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
  await app.listen(port || 3000);
}
bootstrap();
