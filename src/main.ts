import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const port = process.env.PORT || 3000;
//importar algo aqui
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Habilitar CORS correctamente
  app.enableCors({
    origin: '*', // Solo permite peticiones desde el frontend
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });
  await app.listen(port || 3000);
}
bootstrap();
