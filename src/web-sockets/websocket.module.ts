import { Module, forwardRef } from '@nestjs/common';
import { CrmGateway } from './websocket.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { WebSocketServices } from './websocket.service';

@Module({
  imports: [AuthModule],
  providers: [CrmGateway, WebSocketServices],
  exports: [WebSocketServices],
})
export class GatewayModule {}
