import { Module, forwardRef } from '@nestjs/common';
import { CrmGateway } from './websocket.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { WebSocketServices } from './websocket.service';
import { WebSocketController } from './websocket.controller';

@Module({
  imports: [AuthModule],
  controllers: [WebSocketController],
  providers: [CrmGateway, WebSocketServices],
  exports: [WebSocketServices],
})
export class GatewayModule {}
