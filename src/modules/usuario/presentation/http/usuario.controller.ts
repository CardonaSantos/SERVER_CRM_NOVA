import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import {
  ROLES_ADMINISTRACION,
  ROLES_SUPER_ADMIN,
} from 'src/auth/roles/grupos-roles';
import { OperacionSensible } from 'src/auth/step-up/operacion-sensible.decorator';
import { ActivarUsuarioUseCase } from '../../application/use-cases/activar-usuario.use-case';
import { ActualizarUsuarioUseCase } from '../../application/use-cases/actualizar-usuario.use-case';
import { CambiarContrasenaUsuarioUseCase } from '../../application/use-cases/cambiar-contrasena-usuario.use-case';
import { CrearUsuarioUseCase } from '../../application/use-cases/crear-usuario.use-case';
import { DesactivarUsuarioUseCase } from '../../application/use-cases/desactivar-usuario.use-case';
import { EliminarUsuarioUseCase } from '../../application/use-cases/eliminar-usuario.use-case';
import { ListarOpcionesUsuarioUseCase } from '../../application/use-cases/listar-opciones-usuario.use-case';
import { ListarUsuariosUseCase } from '../../application/use-cases/listar-usuarios.use-case';
import { ObtenerUsuarioUseCase } from '../../application/use-cases/obtener-usuario.use-case';
import { RestaurarUsuarioUseCase } from '../../application/use-cases/restaurar-usuario.use-case';
import { ActualizarUsuarioDto } from '../dto/actualizar-usuario.dto';
import { CambiarContrasenaUsuarioDto } from '../dto/cambiar-contrasena-usuario.dto';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { ListarUsuariosQueryDto } from '../dto/listar-usuarios-query.dto';
import { OpcionesUsuarioQueryDto } from '../dto/opciones-usuario-query.dto';
import { RestaurarUsuarioDto } from '../dto/restaurar-usuario.dto';
import { UsuarioPresenter } from '../presenters/usuario.presenter';

/**
 * Gestión de usuarios: la ve la administración y solo el super administrador
 * la modifica. Las opciones para elegir a alguien son de cualquier sesión.
 */
@ApiTags('usuarios')
@Controller('usuarios')
export class UsuarioController {
  constructor(
    private readonly listarUsuarios: ListarUsuariosUseCase,
    private readonly obtenerUsuario: ObtenerUsuarioUseCase,
    private readonly listarOpciones: ListarOpcionesUsuarioUseCase,
    private readonly crearUsuario: CrearUsuarioUseCase,
    private readonly actualizarUsuario: ActualizarUsuarioUseCase,
    private readonly cambiarContrasena: CambiarContrasenaUsuarioUseCase,
    private readonly activarUsuario: ActivarUsuarioUseCase,
    private readonly desactivarUsuario: DesactivarUsuarioUseCase,
    private readonly eliminarUsuario: EliminarUsuarioUseCase,
    private readonly restaurarUsuario: RestaurarUsuarioUseCase,
  ) {}

  @Get()
  @Roles(...ROLES_ADMINISTRACION)
  async listar(@Query() query: ListarUsuariosQueryDto) {
    return UsuarioPresenter.listado(
      await this.listarUsuarios.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        roles: query.roles,
        estados: query.estados,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      }),
    );
  }

  /** Activos, por nombre: técnicos, cobradores… (`?roles=TECNICO`). */
  @Get('opciones')
  async opciones(@Query() query: OpcionesUsuarioQueryDto) {
    const usuarios = await this.listarOpciones.execute({ roles: query.roles });

    return usuarios.map((u) => UsuarioPresenter.opcion(u));
  }

  @Get(':usuarioId')
  @Roles(...ROLES_ADMINISTRACION)
  async detalle(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return UsuarioPresenter.detalle(
      await this.obtenerUsuario.execute(usuarioId),
    );
  }

  @Post()
  @Roles(...ROLES_SUPER_ADMIN)
  async crear(@Body() dto: CrearUsuarioDto, @Actor() actor: ActorHttp) {
    return UsuarioPresenter.guardado(
      await this.crearUsuario.execute({
        actorId: actor.usuarioId,
        empresaId: actor.empresaId,
        nombre: dto.nombre,
        correo: dto.correo,
        telefono: dto.telefono,
        rol: dto.rol,
        contrasena: dto.contrasena,
      }),
    );
  }

  @Patch(':usuarioId')
  @Roles(...ROLES_SUPER_ADMIN)
  async actualizar(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() dto: ActualizarUsuarioDto,
    @Actor() actor: ActorHttp,
  ) {
    return UsuarioPresenter.guardado(
      await this.actualizarUsuario.execute({
        actorId: actor.usuarioId,
        usuarioId,
        nombre: dto.nombre,
        correo: dto.correo,
        telefono: dto.telefono,
        rol: dto.rol,
      }),
    );
  }

  /** Cierra todas las sesiones de ese usuario. La propia va en `/usuarios/yo/contrasena`. */
  @Patch(':usuarioId/contrasena')
  @Roles(...ROLES_SUPER_ADMIN)
  @OperacionSensible()
  async contrasena(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() dto: CambiarContrasenaUsuarioDto,
    @Actor() actor: ActorHttp,
  ) {
    return UsuarioPresenter.contrasenaCambiada(
      await this.cambiarContrasena.execute({
        actorId: actor.usuarioId,
        usuarioId,
        contrasenaActual: dto.contrasenaActual,
        contrasenaNueva: dto.contrasenaNueva,
      }),
    );
  }

  @Post(':usuarioId/activar')
  @Roles(...ROLES_SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async activar(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return UsuarioPresenter.guardado(
      await this.activarUsuario.execute({ usuarioId }),
    );
  }

  /** Cierra todas sus sesiones. */
  @Post(':usuarioId/desactivar')
  @Roles(...ROLES_SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async desactivar(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Actor() actor: ActorHttp,
  ) {
    return UsuarioPresenter.guardado(
      await this.desactivarUsuario.execute({
        actorId: actor.usuarioId,
        usuarioId,
      }),
    );
  }

  /** Borrado lógico: deja libre su correo y conserva lo que registró. */
  @Delete(':usuarioId')
  @Roles(...ROLES_SUPER_ADMIN)
  async eliminar(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Actor() actor: ActorHttp,
  ) {
    return UsuarioPresenter.guardado(
      await this.eliminarUsuario.execute({
        actorId: actor.usuarioId,
        usuarioId,
      }),
    );
  }

  /** Vuelve desactivado. */
  @Post(':usuarioId/restaurar')
  @Roles(...ROLES_SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async restaurar(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() dto: RestaurarUsuarioDto,
  ) {
    return UsuarioPresenter.guardado(
      await this.restaurarUsuario.execute({ usuarioId, correo: dto.correo }),
    );
  }
}
