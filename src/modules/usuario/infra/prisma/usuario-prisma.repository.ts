import { Injectable } from '@nestjs/common';
import { Prisma, RolUsuario } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { UsuarioEntity } from '../../domain/entities/usuario.entity';
import {
  UsuarioCorreoDuplicadoError,
  UsuarioModificadoError,
} from '../../domain/errors/usuario.errors';
import { UsuarioRepositoryPort } from '../../domain/ports/usuario-repository.port';
import { UsuarioPrismaMapper } from './usuario-prisma.mapper';

function esCorreoDuplicado(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

@Injectable()
export class UsuarioPrismaRepository implements UsuarioRepositoryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(id: number): Promise<UsuarioEntity | null> {
    const record = await this.db.usuario.findUnique({ where: { id } });

    return record ? UsuarioPrismaMapper.toDomain(record) : null;
  }

  async findByCorreo(correo: string): Promise<UsuarioEntity | null> {
    const record = await this.db.usuario.findUnique({ where: { correo } });

    return record ? UsuarioPrismaMapper.toDomain(record) : null;
  }

  async create(entity: UsuarioEntity): Promise<UsuarioEntity> {
    try {
      const record = await this.db.usuario.create({
        data: UsuarioPrismaMapper.toCreatePersistence(entity),
      });

      return UsuarioPrismaMapper.toDomain(record);
    } catch (error) {
      if (esCorreoDuplicado(error)) throw new UsuarioCorreoDuplicadoError();
      throw error;
    }
  }

  async update(entity: UsuarioEntity): Promise<UsuarioEntity> {
    try {
      const { count } = await this.db.usuario.updateMany({
        where: { id: entity.id! },
        data: UsuarioPrismaMapper.toUpdatePersistence(entity),
      });
      if (count !== 1) throw new UsuarioModificadoError();
    } catch (error) {
      if (esCorreoDuplicado(error)) throw new UsuarioCorreoDuplicadoError();
      throw error;
    }

    return (await this.findById(entity.id!))!;
  }

  async bloquearParaModificar(id: number): Promise<void> {
    await this.db
      .$queryRaw`SELECT "id" FROM "Usuario" WHERE "id" = ${id} FOR UPDATE`;
  }

  async bloquearSuperAdmins(): Promise<void> {
    await this.db
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext('Usuario.superAdmin'))`;
  }

  contarSuperAdminsActivos(): Promise<number> {
    return this.db.usuario.count({
      where: { rol: RolUsuario.SUPER_ADMIN, activo: true, eliminadoEn: null },
    });
  }
}
