// src/usuarios/app/user.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AdminUpdateUserDto } from '../dto/AdminUpdate.dto';
import { UserTokenAuth } from 'src/auth/dto/userToken.dto';

import { RolUsuario } from '@prisma/client';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../domain/user-repository';
import { Usuario } from '../entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuariosRepo: UsuarioRepository,
  ) {}

  // ===== CREATE =====
  async create(createUserDto: CreateUserDto) {
    try {
      const existing = await this.usuariosRepo.findByCorreo(
        createUserDto.correo,
      );
      if (existing) {
        throw new BadRequestException('Ya existe un usuario con ese correo');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(createUserDto.contrasena, salt);

      const usuario = Usuario.create({
        empresaId: createUserDto.empresaId,
        nombre: createUserDto.nombre,
        correo: createUserDto.correo,
        contrasena: passwordHash,
        rol: createUserDto.rol,
        telefono: (createUserDto as any).telefono ?? null,
      });

      const created = await this.usuariosRepo.create(usuario);
      return created.toObject();
    } catch (error) {
      this.logger.error('Error al crear usuario', error as any);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('No se pudo crear el usuario');
    }
  }

  // ===== FIND BY EMAIL (gmail) =====
  async findByGmail(correo: string) {
    this.logger.debug('Al findByGmail llega: ' + correo);

    const user = await this.usuariosRepo.findByCorreo(correo);

    // Si no existe, devolvemos null para que el AuthService sepa
    if (!user) {
      return null;
    }

    const obj = user.toObject();
    return {
      ...obj,
      empresa: { id: obj.empresaId },
    };
  }

  async getUsuario() {
    // si luego necesitas algo específico lo metes aquí
    return null;
  }

  // ===== FIND ALL =====
  async findAll(_userAuth: UserTokenAuth) {
    const users = await this.usuariosRepo.findMany();
    return users.map((u) => u.toObject());
  }

  // ===== FIND USER INFO =====
  async findUserInfo(id: number) {
    if (!id) {
      throw new NotFoundException('Error id no disponible');
    }

    const usuario = await this.usuariosRepo.findById(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario.toObject();
  }

  // ===== USERS PARA PROFILE CONFIG =====
  async getUsersToProfileConfig() {
    const users = await this.usuariosRepo.findMany();
    if (!users || users.length === 0) {
      throw new NotFoundException('Error al conseguir usuarios');
    }

    return users.map((u) => {
      const obj = u.toObject();
      return {
        id: obj.id,
        nombre: obj.nombre,
        telefono: obj.telefono,
        activo: obj.activo,
        actualizadoEn: obj.actualizadoEn,
        creadoEn: obj.creadoEn,
        correo: obj.correo,
        rol: obj.rol,
      };
    });
  }

  // ===== UPDATE / UPDATE ONE (comparten lógica) =====
  async updateUser(id: number, data: UpdateUserDto) {
    return this.updateUserInternal(id, data);
  }

  async updateOneUser(id: number, dto: UpdateUserDto) {
    return this.updateUserInternal(id, dto);
  }

  private async updateUserInternal(id: number, dto: Partial<UpdateUserDto>) {
    const usuario = await this.usuariosRepo.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // contrasena
    if (dto.contrasena) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(dto.contrasena, salt);
      usuario.cambiarContrasena(hash);
    }

    // datos básicos
    if (
      dto.nombre !== undefined ||
      dto.correo !== undefined ||
      dto.telefono !== undefined
    ) {
      usuario.actualizarDatosBasicos({
        nombre: dto.nombre,
        correo: dto.correo,
        telefono: dto.telefono as any,
      });
    }

    // rol / activo si vienen en DTO admin
    if ((dto as any).rol !== undefined) {
      usuario.cambiarRol((dto as any).rol as RolUsuario);
    }

    if ((dto as any).activo !== undefined) {
      const activo = (dto as any).activo as boolean;
      if (activo) usuario.activar();
      else usuario.desactivar();
    }

    const updated = await this.usuariosRepo.update(usuario);
    return updated.toObject();
  }

  // ===== DELETE =====
  async deleteUser(id: number): Promise<void> {
    const userExist = await this.usuariosRepo.findById(id);
    if (!userExist) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    await this.usuariosRepo.deleteById(id);
  }

  // ===== USERS PARA CREAR TICKETS =====
  async getUsersToCreateTickets() {
    const tecs = await this.usuariosRepo.findMany({ activo: true });
    return tecs.map((t) => ({ id: t.id, nombre: t.nombre }));
  }

  // ===== USERS BY ROLE (proyección especial para UI) =====
  async getUserByRole() {
    const users = await this.usuariosRepo.findMany();
    if (!users || users.length === 0) {
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

  // ===== TÉCNICOS PARA TICKET =====
  async getTecnicosToTicket() {
    const tecs = await this.usuariosRepo.findMany({
      rol: RolUsuario.TECNICO,
      activo: true,
    });

    return tecs.map((t) => ({
      id: t.id,
      nombre: t.nombre,
    }));
  }

  // ===== USERS PARA META =====
  async getUsersToMeta() {
    const users = await this.usuariosRepo.findMany();
    return users.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      rol: u.rol,
    }));
  }

  // setSaldo0: esto pertenece a otro agregado (SaldoCliente),
  // lo ideal es moverlo a otro servicio/repo y no mezclarlo con Usuario.
}
