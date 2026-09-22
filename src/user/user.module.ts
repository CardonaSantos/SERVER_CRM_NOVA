import { Module } from '@nestjs/common';
import { PerfilModule } from 'src/perfil/perfil.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from './app/user.service';
import { UsuarioQueries } from './app/queries/usuario.queries';
import { CreateUserUseCase } from './app/use-cases/create-user.use-case';
import { RestoreUserUseCase } from './app/use-cases/restore-user.use-case';
import { SoftDeleteUserUseCase } from './app/use-cases/soft-delete-user.use-case';
import { UpdateUserProfileUseCase } from './app/use-cases/update-user-profile.use-case';
import { UpdateUserUseCase } from './app/use-cases/update-user.use-case';
import { ValidateUserPasswordUseCase } from './app/use-cases/validate-user-password.use-case';
import {
  PASSWORD_HASHER,
} from './domain/ports/password-hasher.port';
import {
  USUARIO_PROFILE_PORT,
} from './domain/ports/usuario-profile.port';
import { USUARIO_REPOSITORY } from './domain/user-repository';
import { BcryptPasswordHasherAdapter } from './infraestructure/bcrypt-password-hasher.adapter';
import { PerfilServiceAdapter } from './infraestructure/perfil-service.adapter';
import { PrismaUsuarioRepository } from './infraestructure/prisma-user.repository';
import { UserController } from './presentation/user.controller';

@Module({
  imports: [PerfilModule],
  controllers: [UserController],
  providers: [
    PrismaService,
    UserService,
    UsuarioQueries,
    CreateUserUseCase,
    UpdateUserUseCase,
    UpdateUserProfileUseCase,
    SoftDeleteUserUseCase,
    RestoreUserUseCase,
    ValidateUserPasswordUseCase,
    {
      provide: USUARIO_REPOSITORY,
      useClass: PrismaUsuarioRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasherAdapter,
    },
    {
      provide: USUARIO_PROFILE_PORT,
      useClass: PerfilServiceAdapter,
    },
  ],
  exports: [UserService, USUARIO_REPOSITORY],
})
export class UserModule {}
