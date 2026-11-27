import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { PerfilUsuarioEntity } from '../../domain/entities/perfil-usuario.entity';
import { PerfilUsuarioRepositoryPort } from '../../domain/ports/perfil-usuario-repository.port';
import { PerfilUsuarioPrismaMapper } from './perfil-usuario-prisma.mapper';

@Injectable()
export class PerfilUsuarioPrismaRepository
  implements PerfilUsuarioRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findByUsuarioId(
    usuarioId: number,
  ): Promise<PerfilUsuarioEntity | null> {
    const record = await this.db.perfilUsuario.findUnique({
      where: { usuarioId },
    });

    return record ? PerfilUsuarioPrismaMapper.toDomain(record) : null;
  }

  async guardar(entity: PerfilUsuarioEntity): Promise<PerfilUsuarioEntity> {
    const record = await this.db.perfilUsuario.upsert({
      where: { usuarioId: entity.usuarioId },
      create: PerfilUsuarioPrismaMapper.toCreatePersistence(entity),
      update: PerfilUsuarioPrismaMapper.toUpdatePersistence(entity),
    });

    return PerfilUsuarioPrismaMapper.toDomain(record);
  }
}
