import { Injectable } from '@nestjs/common';
import { PerfilRepository } from '../domain/perfil.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaPerfilUsuarioMapper } from '../common/map';
import { Perfil } from '../entities/perfil.entity';

@Injectable()
export class PrismaPerfilRepository implements PerfilRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsuarioId(usuarioId: number) {
    const raw = await this.prisma.perfilUsuario.findUnique({
      where: { usuarioId },
    });

    if (!raw) return null;

    return PrismaPerfilUsuarioMapper.toDomain(raw);
  }

  async save(perfil: Perfil) {
    const data = PrismaPerfilUsuarioMapper.toPersistence(perfil);

    const created = await this.prisma.perfilUsuario.create({
      data,
    });

    return PrismaPerfilUsuarioMapper.toDomain(created);
  }

  async update(perfil: Perfil) {
    const data = PrismaPerfilUsuarioMapper.toUpdate(perfil);

    const updated = await this.prisma.perfilUsuario.update({
      where: { usuarioId: perfil.getUsuarioId() },
      data,
    });

    return PrismaPerfilUsuarioMapper.toDomain(updated);
  }
}
