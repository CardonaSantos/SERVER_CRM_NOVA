import { Module } from '@nestjs/common';
import { RutaCobroService } from './ruta-cobro.service';
import { RutaCobroController } from './ruta-cobro.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GatewayModule } from 'src/web-sockets/websocket.module';

@Module({
  imports: [GatewayModule],
  controllers: [RutaCobroController],
  providers: [RutaCobroService, PrismaService],
})
export class RutaCobroModule {}
