import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { ClienteDesinstalacionPrismaMapper } from './cliente-desinstalacion.prisma.mapper';

export class ClienteDesInstalacionPrismaRepository
  implements ClienteDesInstalacionRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity> {
    const record = await this.prisma.clienteDesinstalacion.create({
      data: ClienteDesinstalacionPrismaMapper.toCreatePersistence(entity),
    });

    return ClienteDesinstalacionPrismaMapper.toDomain(record);
  }
}
