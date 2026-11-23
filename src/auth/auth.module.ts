import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtAuthGuard } from './JwtGuard/jwt-auth.guard';
import { GuardGlobalAuth } from './JwtGuard/guard-global-auth';
import { RolesGuard } from './JwtGuard/roles.guard';
import { ACCESS_TOKEN_TTL_SEGUNDOS } from './sesiones/sesion.constants';

import { UserModule } from 'src/user/user.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [AuthController],

  providers: [
    AuthService,
    JwtAuthGuard,
    // D6: toda ruta exige JWT salvo @Public(). D7: arranca en observación.
    { provide: APP_GUARD, useClass: GuardGlobalAuth },
    // Corre después del anterior (orden de registro): @Roles(...).
    { provide: APP_GUARD, useClass: RolesGuard },
  ],

  imports: [
    UserModule,

    PrismaModule,

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
         * §3.1: access token de 20 min; la sesión vive en BD y se extiende
         * con el refresh token (SesionesService). JwtAuthGuard y el gateway
         * WS rechazan tokens vencidos, sin `exp` o sin sesión (`sid`).
         */
        signOptions: {
          expiresIn: ACCESS_TOKEN_TTL_SEGUNDOS,
          algorithm: 'HS256',
        },
        // Solo el algoritmo con el que firmamos.
        verifyOptions: { algorithms: ['HS256'] },
      }),
      inject: [ConfigService],
    }),
  ],

  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
