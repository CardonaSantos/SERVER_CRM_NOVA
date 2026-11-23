import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtAuthGuard } from './JwtGuard/jwt-auth.guard';

import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [AuthController],

  providers: [AuthService, JwtAuthGuard],

  imports: [
    UserModule,

    JwtModule.registerAsync({
      /*
       * Global: JwtAuthGuard necesita JwtService en cada módulo donde se
       * usa con @UseGuards, y así todos verifican con el mismo secreto.
       */
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('MY_SECRET_TOKEN_KEY_CRM'),
        /*
         * Provisional: 12 h (un turno) mientras no exista refresh token.
         * En la etapa 7 baja a 20 min con refresh. JwtAuthGuard y el
         * gateway WS rechazan tokens vencidos o sin `exp`.
         */
        signOptions: { expiresIn: '12h', algorithm: 'HS256' },
        // Solo el algoritmo con el que firmamos.
        verifyOptions: { algorithms: ['HS256'] },
      }),
      inject: [ConfigService],
    }),
  ],

  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
