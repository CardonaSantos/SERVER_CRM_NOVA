import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './JwtGuard/JwtStrategy';
import { JwtAuthGuard } from './JwtGuard/jwt-auth.guard';

import { UserService } from 'src/user/app/user.service';
import { UserModule } from 'src/user/user.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PerfilModule } from 'src/perfil/perfil.module';

@Module({
  controllers: [AuthController],

  providers: [
    AuthService,
    UserService,
    PrismaService,
    JwtStrategy,
    JwtAuthGuard,
  ],

  imports: [
    PerfilModule,
    UserModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],

      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('MY_SECRET_TOKEN_KEY_CRM'),
      }),

      inject: [ConfigService],
    }),
  ],

  exports: [AuthService, JwtModule, PassportModule, JwtAuthGuard],
})
export class AuthModule {}
