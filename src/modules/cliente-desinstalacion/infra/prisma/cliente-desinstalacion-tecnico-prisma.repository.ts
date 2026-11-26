import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ClienteDesinstalacionTecnicoEntity } from '../../domain/entities/cliente-desinstalacion-tecnico.entity';
import { ClienteDesinstalacionTecnicoRepositoryPort } from '../../domain/ports/cliente-desinstalacion-tecnico-repository.port';
import { ClienteDesinstalacionTecnicoPrismaMapper } from './cliente-desinstalacion-tecnico-prisma.mapper';

@Injectable()
export class ClienteDesinstalacionTecnicoPrismaRepository
  implements ClienteDesinstalacionTecnicoRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** La transacción abierta por una unidad de trabajo, o el cliente normal. */
  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    entity: ClienteDesinstalacionTecnicoEntity,
  ): Promise<ClienteDesinstalacionTecnicoEntity> {
    const record = await this.db.clienteDesinstalacionTecnico.create({
      data: ClienteDesinstalacionTecnicoPrismaMapper.toCreatePersistence(
        entity,
      ),
    });

    return ClienteDesinstalacionTecnicoPrismaMapper.toDomain(record);
  }

  /** Una sola sentencia: se guardan todos o ninguno. */
  async createMany(
    entities: ClienteDesinstalacionTecnicoEntity[],
  ): Promise<ClienteDesinstalacionTecnicoEntity[]> {
    if (entities.length === 0) return [];

    const records =
      await this.db.clienteDesinstalacionTecnico.createManyAndReturn({
        data: entities.map((entity) =>
          ClienteDesinstalacionTecnicoPrismaMapper.toCreatePersistence(entity),
        ),
      });

    return records.map(ClienteDesinstalacionTecnicoPrismaMapper.toDomain);
  }

  async findByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionTecnicoEntity[]> {
    const records = await this.db.clienteDesinstalacionTecnico.findMany({
      where: { desinstalacionId },
      orderBy: [{ esResponsable: 'desc' }, { creadoEn: 'asc' }],
    });

    return records.map(ClienteDesinstalacionTecnicoPrismaMapper.toDomain);
  }

  async deleteById(params: {
    desinstalacionId: number;
    tecnicoOperacionId: number;
  }): Promise<void> {
    await this.db.clienteDesinstalacionTecnico.deleteMany({
      where: {
        id: params.tecnicoOperacionId,
        desinstalacionId: params.desinstalacionId,
      },
    });
  }
}
