import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';

import { ClientePppoeCuentaRepositoryPort } from '../../domain/ports/cliente-pppoe-cuenta-repository.port';

import { ClientePppoeCuentaPrismaMapper } from './cliente-pppoe-cuenta-prisma.mapper';

import { ClientePppoeCuentaProtegidaInstalacion } from '../../domain/read-models/cliente-pppoe-cuenta-protegida-instalacion.read-model';

import { EstadoCuentaPppoe } from '../../domain/enums/estado-cuenta-pppoe.enum';
import { ClientePppoeCuentaEntity } from '../../domain/entities/cliente-pppoe-cuenta.entity';

@Injectable()
export class ClientePppoeCuentaPrismaRepository
  implements ClientePppoeCuentaRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** La transacción abierta por una unidad de trabajo, o el cliente normal. */
  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    entity: ClientePppoeCuentaEntity,
  ): Promise<ClientePppoeCuentaEntity> {
    const record = await this.db.clientePppoeCuenta.create({
      data: ClientePppoeCuentaPrismaMapper.toCreatePersistence(entity),
    });

    return ClientePppoeCuentaPrismaMapper.toDomain(record);
  }

  async update(
    entity: ClientePppoeCuentaEntity,
  ): Promise<ClientePppoeCuentaEntity> {
    const id = entity.id;

    if (id === null) {
      throw new Error(
        'No se puede actualizar una cuenta PPPoE sin identificador.',
      );
    }

    const record = await this.db.clientePppoeCuenta.update({
      where: {
        id,
      },

      data: ClientePppoeCuentaPrismaMapper.toUpdatePersistence(entity),
    });

    return ClientePppoeCuentaPrismaMapper.toDomain(record);
  }

  async findById(id: number): Promise<ClientePppoeCuentaEntity | null> {
    const record = await this.db.clientePppoeCuenta.findUnique({
      where: {
        id,
      },
    });

    return record ? ClientePppoeCuentaPrismaMapper.toDomain(record) : null;
  }

  async findByAccesoInternetId(
    accesoInternetId: number,
  ): Promise<ClientePppoeCuentaEntity | null> {
    const record = await this.db.clientePppoeCuenta.findUnique({
      where: {
        accesoInternetId,
      },
    });

    return record ? ClientePppoeCuentaPrismaMapper.toDomain(record) : null;
  }

  async findVigenteByUsuario(
    usuario: string,
  ): Promise<ClientePppoeCuentaEntity | null> {
    const record = await this.db.clientePppoeCuenta.findFirst({
      where: {
        usuario,

        estado: {
          notIn: [EstadoCuentaPppoe.ELIMINADA, EstadoCuentaPppoe.CANCELADA],
        },
      },

      orderBy: {
        id: 'desc',
      },
    });

    return record ? ClientePppoeCuentaPrismaMapper.toDomain(record) : null;
  }

  async findProtectedByInstalacionId(
    instalacionId: number,
  ): Promise<ClientePppoeCuentaProtegidaInstalacion[]> {
    const records = await this.db.clientePppoeCuenta.findMany({
      where: {
        accesoInternet: {
          is: {
            instalaciones: {
              some: {
                instalacionId,
              },
            },
          },
        },
      },

      select: {
        id: true,

        empresaId: true,
        accesoInternetId: true,
        perfilHomologacionId: true,

        usuario: true,

        secretoCifrado: true,
        secretoIv: true,
        secretoAuthTag: true,
        versionClave: true,

        estado: true,
        generadoEn: true,

        accesoInternet: {
          select: {
            clienteId: true,
          },
        },

        perfilHomologacion: {
          select: {
            mikrotikRouterId: true,
            servicioInternetId: true,
            codigoPerfil: true,
          },
        },
      },

      orderBy: {
        id: 'asc',
      },
    });

    return records.map((record) => ({
      cuentaPppoeId: record.id,

      empresaId: record.empresaId,

      clienteId: record.accesoInternet.clienteId,

      accesoInternetId: record.accesoInternetId,

      perfilHomologacionId: record.perfilHomologacionId,

      mikrotikRouterId: record.perfilHomologacion.mikrotikRouterId,

      servicioInternetId: record.perfilHomologacion.servicioInternetId,

      codigoPerfil: record.perfilHomologacion.codigoPerfil,

      usuario: record.usuario,

      secretoCifrado: record.secretoCifrado,
      secretoIv: record.secretoIv,
      secretoAuthTag: record.secretoAuthTag,
      versionClave: record.versionClave,

      estadoCuenta: this.mapEstadoCuenta(record.estado),

      generadoEn: record.generadoEn,
    }));
  }

  private mapEstadoCuenta(estado: string): EstadoCuentaPppoe {
    const estadoDominio = Object.values(EstadoCuentaPppoe).find(
      (value) => value === estado,
    );

    if (!estadoDominio) {
      throw new Error(
        `El estado PPPoE "${estado}" no está reconocido por el dominio.`,
      );
    }

    return estadoDominio;
  }
}
