import { Injectable } from '@nestjs/common';
import { UserTokenAuth } from 'src/auth/dto/userToken.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateOneUserDto } from '../dto/update-one-user.dto';
import { UpdateUserDto } from '../dto/updateProfile';
import { UsuarioQueries } from './queries/usuario.queries';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { RestoreUserUseCase } from './use-cases/restore-user.use-case';
import { SoftDeleteUserUseCase } from './use-cases/soft-delete-user.use-case';
import { UpdateUserProfileUseCase } from './use-cases/update-user-profile.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { ValidateUserPasswordUseCase } from './use-cases/validate-user-password.use-case';

@Injectable()
export class UserService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly softDeleteUserUseCase: SoftDeleteUserUseCase,
    private readonly restoreUserUseCase: RestoreUserUseCase,
    private readonly validateUserPasswordUseCase: ValidateUserPasswordUseCase,
    private readonly queries: UsuarioQueries,
  ) {}

  create(dto: CreateUserDto) {
    return this.createUserUseCase.execute(dto);
  }

  findByGmail(correo: string) {
    return this.queries.findByGmail(correo);
  }

  getUsuario() {
    return null;
  }

  findAll(userAuth?: UserTokenAuth) {
    return this.queries.findAll(userAuth);
  }

  findDeleted(userAuth?: UserTokenAuth) {
    return this.queries.findDeleted(userAuth);
  }

  findUserInfo(id: number) {
    return this.queries.findUserInfo(id);
  }

  getUsersToProfileConfig(userAuth?: UserTokenAuth) {
    return this.queries.getUsersToProfileConfig(userAuth);
  }

  updateUser(
    id: number,
    data: UpdateUserDto,
    avatar?: Express.Multer.File,
    portada?: Express.Multer.File,
  ) {
    return this.updateUserProfileUseCase.execute(id, data, avatar, portada);
  }

  updateOneUser(id: number, dto: UpdateOneUserDto) {
    return this.updateUserUseCase.execute(id, dto);
  }

  async deleteUser(id: number, eliminadoPorId?: number): Promise<void> {
    await this.softDeleteUserUseCase.execute(id, eliminadoPorId);
  }

  restoreUser(id: number) {
    return this.restoreUserUseCase.execute(id);
  }

  activateUser(id: number) {
    return this.updateUserUseCase.execute(id, { activo: true });
  }

  deactivateUser(id: number) {
    return this.updateUserUseCase.execute(id, { activo: false });
  }

  getUsersToCreateTickets(userAuth?: UserTokenAuth) {
    return this.queries.getUsersToCreateTickets(userAuth);
  }

  getUserByRole(userAuth?: UserTokenAuth) {
    return this.queries.getUserByRole(userAuth);
  }

  getTecnicosToTicket(userAuth?: UserTokenAuth) {
    return this.queries.getTecnicosToTicket(userAuth);
  }

  getUsersToMeta(userAuth?: UserTokenAuth) {
    return this.queries.getUsersToMeta(userAuth);
  }

  validarContrasenaActual(usuarioId: number, contrasenaActual: string) {
    return this.validateUserPasswordUseCase.execute(usuarioId, contrasenaActual);
  }
}
