import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { throwFatalError } from 'src/Utils/CommonFatalError';

import { Usuario } from '../domain/entities/usuario.entity';
import { UsuarioFilter, UsuarioRepository } from '../domain/user-repository';

import { PrismaUsuarioMapper } from './mappers/prisma-usuario.mapper';

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  private readonly logger = new Logger(PrismaUsuarioRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(usuario: Usuario): Promise<Usuario> {
    try {
      const created = await this.prisma.usuario.create({
        data: PrismaUsuarioMapper.toCreate(usuario),
      });

      return PrismaUsuarioMapper.toDomain(created);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaUsuarioRepository - create');

      throw error;
    }
  }

  async update(usuario: Usuario): Promise<Usuario> {
    try {
      const updated = await this.prisma.usuario.update({
        where: {
          id: usuario.id,
        },
        data: PrismaUsuarioMapper.toUpdate(usuario),
      });

      return PrismaUsuarioMapper.toDomain(updated);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaUsuarioRepository - update');

      throw error;
    }
  }

  async findById(id: number): Promise<Usuario | null> {
    try {
      const row = await this.prisma.usuario.findUnique({
        where: {
          id,
        },
      });

      return row ? PrismaUsuarioMapper.toDomain(row) : null;
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaUsuarioRepository - findById');

      throw error;
    }
  }

  async findByCorreo(correo: string): Promise<Usuario | null> {
    try {
      const row = await this.prisma.usuario.findUnique({
        where: {
          correo: correo.trim().toLowerCase(),
        },
      });

      return row ? PrismaUsuarioMapper.toDomain(row) : null;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaUsuarioRepository - findByCorreo',
      );

      throw error;
    }
  }

  async findMany(filter?: UsuarioFilter): Promise<Usuario[]> {
    try {
      const rows = await this.prisma.usuario.findMany({
        where: this.buildWhere(filter),
        orderBy: {
          creadoEn: 'desc',
        },
      });

      return rows.map((row) => PrismaUsuarioMapper.toDomain(row));
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaUsuarioRepository - findMany');

      throw error;
    }
  }

  private buildWhere(filter?: UsuarioFilter): Prisma.UsuarioWhereInput {
    const where: Prisma.UsuarioWhereInput = {};

    if (filter?.empresaId !== undefined) {
      where.empresaId = filter.empresaId;
    }

    if (filter?.rol !== undefined) {
      where.rol = filter.rol;
    }

    if (filter?.activo !== undefined) {
      where.activo = filter.activo;
    }

    return where;
  }
}
