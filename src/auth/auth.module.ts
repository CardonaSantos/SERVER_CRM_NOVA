import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtStrategy } from './JwtGuard/JwtStrategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UserService, PrismaService, JwtStrategy],
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // Necesario para cargar el ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('MY_SECRET_TOKEN_KEY_CRM'), // Asegúrate de que esta variable esté en tu archivo .env
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService], // Inyecta el ConfigService para acceder a las variables de entorno
    }),
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
