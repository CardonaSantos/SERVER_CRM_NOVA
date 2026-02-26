import { Module } from '@nestjs/common';
import { UserService } from './app/user.service';
import { UserController } from './presentation/user.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { USUARIO_REPOSITORY } from './domain/user-repository';
import { PrismaUsuarioRepository } from './infraestructure/prisma-user.repository';
import { PerfilModule } from 'src/perfil/perfil.module';

@Module({
  imports: [PerfilModule],
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    {
      provide: USUARIO_REPOSITORY,
      useClass: PrismaUsuarioRepository,
    },
  ],
  exports: [UserService, USUARIO_REPOSITORY],
})
export class UserModule {}
