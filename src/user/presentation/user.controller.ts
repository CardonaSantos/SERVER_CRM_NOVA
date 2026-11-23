import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { GetUserAuthToken } from 'src/CustomDecoratorAuthToken/GetUserAuthToken';
import { UserTokenAuth } from 'src/auth/dto/userToken.dto';
import { UserService } from '../app/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateOneUserDto } from '../dto/update-one-user.dto';
import { UpdateUserDto } from '../dto/updateProfile';
import { RolUsuario } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { UsuarioAutenticado } from 'src/auth/JwtGuard/jwt-payload';

/**
 * SUPER_ADMIN edita a cualquiera. Los demás, solo su propio perfil y sin
 * cambiar rol ni activo: si el formulario reenvía el valor actual se
 * descarta en silencio; si intenta cambiarlo, 403. Se compara como texto
 * porque el perfil llega por multipart.
 */
function autorizarEdicionDeUsuario(
  usuario: UsuarioAutenticado | undefined,
  idObjetivo: number,
  dto: { rol?: unknown; activo?: unknown },
): void {
  if (!usuario) {
    throw new ForbiddenException('No tiene permisos para esta operación.');
  }

  if (usuario.rol === RolUsuario.SUPER_ADMIN) return;

  if (usuario.id !== idObjetivo) {
    throw new ForbiddenException('Solo puede editar su propio perfil.');
  }

  const actuales = { rol: usuario.rol, activo: usuario.activo };

  for (const campo of ['rol', 'activo'] as const) {
    if (dto[campo] === undefined || dto[campo] === null) continue;

    if (String(dto[campo]) !== String(actuales[campo])) {
      throw new ForbiddenException(`No tiene permisos para cambiar ${campo}.`);
    }

    delete dto[campo];
  }
}

@UseGuards(JwtAuthGuard)
@Controller('user')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  /*
   * Gestión de usuarios (etapa 8): solo SUPER_ADMIN crea, activa,
   * desactiva, restaura y borra; los demás solo editan su propio perfil y
   * no cambian rol ni activo. Antes cualquier usuario con sesión podía
   * cambiar rol/contraseña de cualquiera (escalar a SUPER_ADMIN).
   */
  @Post()
  @Roles(RolUsuario.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  findAll(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.findAll(userAuth);
  }

  @Get('/deleted')
  findDeleted(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.findDeleted(userAuth);
  }

  @Get('/get-usuarios')
  getUsuario() {
    return this.userService.getUsuario();
  }

  @Get('/user-profile-info/:id')
  findUserInfo(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findUserInfo(id);
  }

  @Get('/get-user-profile-config')
  getUsersConfig(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.getUsersToProfileConfig(userAuth);
  }

  @Get('/get-users-to-create-tickets')
  getUsersToCreateTickets(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.getUsersToCreateTickets(userAuth);
  }

  @Get('/get-users-to-rutas')
  getUserToRuta(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.getUserByRole(userAuth);
  }

  @Get('/get-tecnicos-to-ticket')
  getTecnicosToTicket(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.getTecnicosToTicket(userAuth);
  }

  @Get('/get-users-to-meta-support')
  getUsersToMeta(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.getUsersToMeta(userAuth);
  }

  @Put('user-profile/:id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'portada', maxCount: 1 },
    ]),
  )
  async updateUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @UploadedFiles()
    files: { avatar?: Express.Multer.File[]; portada?: Express.Multer.File[] },
    @Req() request: Request & { user?: UsuarioAutenticado },
  ) {
    autorizarEdicionDeUsuario(request.user, id, dto);

    const avatar = files?.avatar?.[0];
    const portada = files?.portada?.[0];

    this.logger.debug(`Actualización de perfil para usuario ${id}`);
    return this.userService.updateUser(id, dto, avatar, portada);
  }

  @Put('/update-user-profile/:id')
  updateOneUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOneUserDto,
    @Req() request: Request & { user?: UsuarioAutenticado },
  ) {
    autorizarEdicionDeUsuario(request.user, id, dto);

    return this.userService.updateOneUser(id, dto);
  }

  @Patch('/user-profile/:id/activate')
  @Roles(RolUsuario.SUPER_ADMIN)
  activateUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.activateUser(id);
  }

  @Patch('/user-profile/:id/deactivate')
  @Roles(RolUsuario.SUPER_ADMIN)
  deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deactivateUser(id);
  }

  @Patch('/user-profile/:id/restore')
  @Roles(RolUsuario.SUPER_ADMIN)
  restoreUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.restoreUser(id);
  }

  //   @Patch('/user-profile/:id/deactivate')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async deactivateUserProfile(
  //   @Param('id', ParseIntPipe) id: number,
  // ): Promise<void> {
  //   await this.userService.deactivateUser(id);
  // }

  @Delete('/user-profile/:id')
  @Roles(RolUsuario.SUPER_ADMIN)
  async deleteUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @GetUserAuthToken() userAuth?: UserTokenAuth,
  ): Promise<void> {
    const actorId = this.getActorId(userAuth);
    await this.userService.deleteUser(id, actorId);
  }

  private getActorId(userAuth?: UserTokenAuth): number | undefined {
    const value = (userAuth as unknown as { id?: unknown } | undefined)?.id;
    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? value
      : undefined;
  }
}
