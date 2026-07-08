import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteDesinstalacionTecnicoEntity } from '../../domain/entities/cliente-desinstalacion-tecnico.entity';
import { ClienteDesinstalacionTecnicoRepositoryPort } from '../../domain/ports/cliente-desinstalacion-tecnico.repository.port';
import { ClienteDesinstalacionTecnicoPrismaMapper } from './cliente-desinstalacion-tecnico.prisma.mapper';

@Injectable()
export class ClienteDesinstalacionTecnicoPrismaRepository
  implements ClienteDesinstalacionTecnicoRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: ClienteDesinstalacionTecnicoEntity,
  ): Promise<ClienteDesinstalacionTecnicoEntity> {
    const record = await this.prisma.clienteDesinstalacionTecnico.create({
      data: ClienteDesinstalacionTecnicoPrismaMapper.toCreatePersistence(
        entity,
      ),
    });

    return ClienteDesinstalacionTecnicoPrismaMapper.toDomain(record);
  }

  async createMany(
    entities: ClienteDesinstalacionTecnicoEntity[],
  ): Promise<ClienteDesinstalacionTecnicoEntity[]> {
    if (entities.length === 0) return [];

    const records = await this.prisma.$transaction(
      entities.map((entity) =>
        this.prisma.clienteDesinstalacionTecnico.create({
          data: ClienteDesinstalacionTecnicoPrismaMapper.toCreatePersistence(
            entity,
          ),
        }),
      ),
    );

    return records.map(ClienteDesinstalacionTecnicoPrismaMapper.toDomain);
  }

  async findByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionTecnicoEntity[]> {
    const records = await this.prisma.clienteDesinstalacionTecnico.findMany({
      where: {
        desinstalacionId,
      },
      orderBy: [{ esResponsable: 'desc' }, { creadoEn: 'asc' }],
    });

    return records.map(ClienteDesinstalacionTecnicoPrismaMapper.toDomain);
  }

  async deleteById(params: {
    desinstalacionId: number;
    tecnicoOperacionId: number;
  }): Promise<void> {
    await this.prisma.clienteDesinstalacionTecnico.deleteMany({
      where: {
        id: params.tecnicoOperacionId,
        desinstalacionId: params.desinstalacionId,
      },
    });
  }
}
