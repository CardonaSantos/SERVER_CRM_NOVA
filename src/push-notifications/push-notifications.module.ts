import { Module } from '@nestjs/common';

import { PushDispositivosModule } from '../push-dispositivos/push-dispositivos.module';
import { FirebasePushService } from './infra/firebase-push.service';

@Module({
  imports: [
    /*
     * Nos proporciona PushDispositivosService.
     */
    PushDispositivosModule,
  ],

  providers: [FirebasePushService],

  /*
   * TicketsSoporteModule importará este módulo y podrá
   * inyectar FirebasePushService.
   */
  exports: [FirebasePushService],
})
export class PushNotificationsModule {}
