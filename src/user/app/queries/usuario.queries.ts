import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { UserTokenAuth } from 'src/auth/dto/userToken.dto';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../../domain/user-repository';
import {
  USUARIO_PROFILE_PORT,
  UsuarioProfilePort,
} from '../../domain/ports/usuario-profile.port';

@Injectable()
export class UsuarioQueries {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuariosRepo: UsuarioRepository,
    @Inject(USUARIO_PROFILE_PORT)
    private readonly profilePort: UsuarioProfilePort,
  ) {}

  async findByGmail(correo: string) {
    const usuario = await this.usuariosRepo.findByCorreo(correo);
    if (!usuario) return null;

    const data = usuario.toObject();

    return {
      id: data.id,
      empresaId: data.empresaId,
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
      rol: data.rol,
      activo: data.activo,
      creadoEn: data.creadoEn,
      actualizadoEn: data.actualizadoEn,
      contrasena: data.contrasena,
      empresa: { id: data.empresaId },
    };
  }

  async findAll(userAuth?: UserTokenAuth) {
    const users = await this.usuariosRepo.findMany({
      empresaId: this.getEmpresaId(userAuth),
    });
    return users.map((user) => user.toPublicObject());
  }

  async findDeleted(userAuth?: UserTokenAuth) {
    const users = await this.usuariosRepo.findMany({
      empresaId: this.getEmpresaId(userAuth),
      soloEliminados: true,
    });
    return users.map((user) => user.toDeletedObject());
  }

  async findUserInfo(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('Error id no disponible');
    }

    const usuario = await this.usuariosRepo.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const perfil = await this.profilePort.obtenerPorUsuarioId(id);

    return {
      ...usuario.toPublicObject(),
      perfil,
    };
  }

  async getUsersToProfileConfig(userAuth?: UserTokenAuth) {
    const users = await this.usuariosRepo.findMany({
      empresaId: this.getEmpresaId(userAuth),
    });

    if (users.length === 0) {
      throw new NotFoundException('Error al conseguir usuarios');
    }

    return users.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      telefono: user.telefono,
      activo: user.activo,
      actualizadoEn: user.actualizadoEn,
      creadoEn: user.creadoEn,
      correo: user.correo,
      rol: user.rol,
    }));
  }

  async getUsersToCreateTickets(userAuth?: UserTokenAuth) {
    const users = await this.usuariosRepo.findMany({
      empresaId: this.getEmpresaId(userAuth),
      activo: true,
    });

    return users.map((user) => ({ id: user.id, nombre: user.nombre }));
  }

  async getUserByRole(userAuth?: UserTokenAuth) {
    const users = await this.usuariosRepo.findMany({
      empresaId: this.getEmpresaId(userAuth),
    });

    if (users.length === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return users.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      apellidos: user.nombre,
      email: user.correo,
      telefono: user.telefono,
      rol: user.rol,
    }));
  }

  async getTecnicosToTicket(userAuth?: UserTokenAuth) {
    const users = await this.usuariosRepo.findMany({
      empresaId: this.getEmpresaId(userAuth),
      rol: RolUsuario.TECNICO,
      activo: true,
    });

    return users.map((user) => ({
      id: user.id,
      nombre: user.nombre,
    }));
  }

  async getUsersToMeta(userAuth?: UserTokenAuth) {
    const users = await this.usuariosRepo.findMany({
      empresaId: this.getEmpresaId(userAuth),
    });

    return users.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      rol: user.rol,
    }));
  }

  private getEmpresaId(userAuth?: UserTokenAuth): number | undefined {
    const value = (userAuth as unknown as { empresaId?: unknown } | undefined)
      ?.empresaId;

    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? value
      : undefined;
  }
}
