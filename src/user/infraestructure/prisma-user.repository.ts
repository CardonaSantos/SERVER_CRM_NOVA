// src/usuarios/infra/prisma-usuario.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { throwFatalError } from 'src/Utils/CommonFatalError';
import { Usuario as UsuarioRow } from '@prisma/client';
import { UsuarioFilter, UsuarioRepository } from '../domain/user-repository';
import { Usuario } from '../entities/user.entity';

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  private readonly logger = new Logger(PrismaUsuarioRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: UsuarioRow): Usuario {
    return Usuario.fromPrisma(row);
  }

  private buildWhere(filter?: UsuarioFilter) {
    if (!filter) return {};
    const where: any = {};
    if (filter.empresaId !== undefined) where.empresaId = filter.empresaId;
    if (filter.rol !== undefined) where.rol = filter.rol;
    if (filter.activo !== undefined) where.activo = filter.activo;
    return where;
  }

  async create(usuario: Usuario): Promise<Usuario> {
    try {
      const data = usuario.toObject();

      const created = await this.prisma.usuario.create({
        data: {
          empresaId: data.empresaId,
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono,
          rol: data.rol,
          activo: data.activo,
          contrasena: data.contrasena,
        },
      });

      return this.toDomain(created);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaUsuarioRepository - create');
    }
  }

  async update(usuario: Usuario): Promise<Usuario> {
    try {
      const data = usuario.toObject();
      if (!data.id) throw new Error('No se puede actualizar Usuario sin id');

      const updated = await this.prisma.usuario.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono,
          rol: data.rol,
          activo: data.activo,
          contrasena: data.contrasena,
        },
      });

      return this.toDomain(updated);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaUsuarioRepository - update');
    }
  }

  async deleteById(id: number): Promise<void> {
    try {
      await this.prisma.usuario.delete({ where: { id } });
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaUsuarioRepository - deleteById',
      );
    }
  }

  async findById(id: number): Promise<Usuario | null> {
    try {
      const row = await this.prisma.usuario.findUnique({ where: { id } });
      if (!row) return null;
      return this.toDomain(row);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaUsuarioRepository - findById');
    }
  }

  async findByCorreo(correo: string): Promise<Usuario | null> {
    try {
      const row = await this.prisma.usuario.findFirst({
        where: { correo: correo.toLowerCase() },
      });
      if (!row) return null;
      return this.toDomain(row);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaUsuarioRepository - findByCorreo',
      );
    }
  }

  async findMany(filter?: UsuarioFilter): Promise<Usuario[]> {
    try {
      const where = this.buildWhere(filter);

      const rows = await this.prisma.usuario.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
      });

      return rows.map((r) => this.toDomain(r));
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaUsuarioRepository - findMany');
    }
  }
}
