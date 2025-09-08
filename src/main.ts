import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const port = process.env.PORT || 3000;

//importar algo aqui VERGA-error
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Habilitar CORS correctamente
  app.enableCors({
    origin: [
      // 'https://sabisu-auto.up.railway.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5173',
      'https://pos-crm-nova.up.railway.app/dashboard',
      'https://pos-crm-nova.up.railway.app/crm',
    ],
    credentials: true, // <- para cookies/withCredentials
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // exposedHeaders: ['set-cookie'], // opcional
  });
  await app.listen(port || 3000);
}
bootstrap();
