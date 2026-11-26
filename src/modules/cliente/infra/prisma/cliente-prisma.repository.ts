import { Injectable } from '@nestjs/common';
import { EstadoCliente, TipoCambioEstadoCliente } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ClienteEntity } from '../../domain/entities/cliente.entity';
import { ClienteModificadoError } from '../../domain/errors/cliente.errors';
import { ClienteRepositoryPort } from '../../domain/ports/cliente-repository.port';
import { CambioCliente } from '../../domain/props/cliente.props';
import { ClientePrismaMapper } from './cliente-prisma.mapper';

@Injectable()
export class ClientePrismaRepository implements ClienteRepositoryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(id: number): Promise<ClienteEntity | null> {
    const record = await this.db.clienteInternet.findUnique({ where: { id } });

    return record ? ClientePrismaMapper.toDomain(record) : null;
  }

  async update(entity: ClienteEntity): Promise<ClienteEntity> {
    const id = entity.id!;
    const cambios = entity.getChangedPrimitives();

    if (Object.keys(cambios).length > 0) {
      const { count } = await this.db.clienteInternet.updateMany({
        where: {
          id,
          ...(cambios.estadoCliente !== undefined && {
            estadoCliente: entity.estadoOriginal as string as EstadoCliente,
          }),
        },
        data: ClientePrismaMapper.toUpdatePersistence(cambios),
      });

      if (count !== 1) throw new ClienteModificadoError();
    }

    const record = await this.db.clienteInternet.findUniqueOrThrow({
      where: { id },
    });

    return ClientePrismaMapper.toDomain(record);
  }

  async registrarCambio(cambio: CambioCliente): Promise<void> {
    await this.db.clienteEstadoHistorial.create({
      data: {
        empresaId: cambio.empresaId,
        clienteId: cambio.clienteId,
        tipoCambio: cambio.tipoCambio as string as TipoCambioEstadoCliente,
        estadoAnterior: cambio.estadoAnterior as string as EstadoCliente | null,
        estadoNuevo: cambio.estadoNuevo as string as EstadoCliente | null,
        isEliminadoAnterior: cambio.eliminado?.anterior,
        isEliminadoNuevo: cambio.eliminado?.nuevo,
        motivo: cambio.motivo,
        descripcion: cambio.descripcion,
        cambiadoPorId: cambio.cambiadoPorId,
      },
    });
  }
}
