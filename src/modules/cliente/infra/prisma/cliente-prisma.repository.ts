import { Injectable } from '@nestjs/common';
import { EstadoCliente, Prisma, TipoCambioEstadoCliente } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ClienteEntity } from '../../domain/entities/cliente.entity';
import {
  ClienteModificadoError,
  ClienteReferenciaInvalidaError,
} from '../../domain/errors/cliente.errors';
import { Coordenadas } from '../../domain/policies/coordenadas.policy';
import {
  ClienteRepositoryPort,
  GuardarIpCliente,
} from '../../domain/ports/cliente-repository.port';
import { CambioCliente } from '../../domain/props/cliente.props';
import { IpClienteReadModel } from '../../domain/read-models/ip-cliente.read-model';
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

  async create(entity: ClienteEntity): Promise<ClienteEntity> {
    const record = await this.conReferenciasValidas(() =>
      this.db.clienteInternet.create({
        data: ClientePrismaMapper.toCreatePersistence(entity),
      }),
    );

    return ClientePrismaMapper.toDomain(record);
  }

  async update(entity: ClienteEntity): Promise<ClienteEntity> {
    const id = entity.id!;
    const cambios = entity.getChangedPrimitives();

    if (Object.keys(cambios).length > 0) {
      const { count } = await this.conReferenciasValidas(() =>
        this.db.clienteInternet.updateMany({
          where: {
            id,
            ...(cambios.estadoCliente !== undefined && {
              estadoCliente: entity.estadoOriginal as string as EstadoCliente,
            }),
          },
          data: ClientePrismaMapper.toUpdatePersistence(cambios),
        }),
      );

      if (count !== 1) throw new ClienteModificadoError();
    }

    const record = await this.db.clienteInternet.findUniqueOrThrow({
      where: { id },
    });

    return ClientePrismaMapper.toDomain(record);
  }

  async guardarIp(
    clienteId: number,
    ip: GuardarIpCliente,
  ): Promise<IpClienteReadModel> {
    const record = await this.db.iP.upsert({
      where: { clienteId },
      update: ip,
      create: { ...ip, clienteId },
    });

    return {
      id: record.id,
      clienteId,
      direccionIp: record.direccionIp,
      gateway: record.gateway,
      mascara: record.mascara,
    };
  }

  async guardarUbicacion(
    clienteId: number,
    empresaId: number,
    coordenadas: Coordenadas,
  ): Promise<void> {
    await this.db.ubicacion.upsert({
      where: { clienteId },
      update: coordenadas,
      create: { ...coordenadas, clienteId, empresaId },
    });
  }

  async reemplazarServicios(
    clienteId: number,
    servicioIds: number[],
    fechaInicio: Date | null,
  ): Promise<void> {
    await this.db.clienteServicio.deleteMany({ where: { clienteId } });

    if (servicioIds.length === 0) return;

    await this.conReferenciasValidas(() =>
      this.db.clienteServicio.createMany({
        data: servicioIds.map((servicioId) => ({
          clienteId,
          servicioId,
          fechaInicio: fechaInicio ?? undefined,
          estado: 'ACTIVO',
        })),
      }),
    );
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

  /** P2003: se asignó una zona, plan, sector, servicio… que no existe. */
  private async conReferenciasValidas<T>(
    escritura: () => Promise<T>,
  ): Promise<T> {
    try {
      return await escritura();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ClienteReferenciaInvalidaError();
      }
      throw error;
    }
  }
}
