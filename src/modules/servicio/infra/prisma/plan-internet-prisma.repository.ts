import { Injectable } from '@nestjs/common';
import { EstadoAccesoInternet, EstadoCliente } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { PlanInternetEntity } from '../../domain/entities/plan-internet.entity';
import { PlanInternetModificadoError } from '../../domain/errors/servicio.errors';
import {
  ClientesDelPlan,
  PlanInternetRepositoryPort,
  UsoPlanInternet,
} from '../../domain/ports/plan-internet-repository.port';
import { PlanInternetPrismaMapper } from './plan-internet-prisma.mapper';

@Injectable()
export class PlanInternetPrismaRepository
  implements PlanInternetRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(id: number): Promise<PlanInternetEntity | null> {
    const record = await this.db.servicioInternet.findUnique({ where: { id } });

    return record ? PlanInternetPrismaMapper.toDomain(record) : null;
  }

  async create(entity: PlanInternetEntity): Promise<PlanInternetEntity> {
    const record = await this.db.servicioInternet.create({
      data: PlanInternetPrismaMapper.toCreatePersistence(entity),
    });

    return PlanInternetPrismaMapper.toDomain(record);
  }

  async update(entity: PlanInternetEntity): Promise<PlanInternetEntity> {
    const { count } = await this.db.servicioInternet.updateMany({
      where: { id: entity.id!, eliminadoEn: null },
      data: PlanInternetPrismaMapper.toUpdatePersistence(entity),
    });
    if (count !== 1) throw new PlanInternetModificadoError();

    return entity;
  }

  async guardarPrecio(entity: PlanInternetEntity): Promise<void> {
    const props = entity.toPrimitives();
    const { count } = await this.db.servicioInternet.updateMany({
      where: { id: entity.id!, eliminadoEn: null },
      data: { precio: props.precio, actualizadoEn: props.actualizadoEn },
    });
    if (count !== 1) throw new PlanInternetModificadoError();
  }

  async bloquearNombres(): Promise<void> {
    await this.db
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext('ServicioInternet.nombre'))`;
  }

  async existeNombre(nombre: string, excluirId?: number): Promise<boolean> {
    // `lower` y no ILIKE: un "_" o "%" del nombre no debe actuar de comodín.
    const filas = await this.db.$queryRaw<{ id: number }[]>`
      SELECT "id" FROM "ServicioInternet"
      WHERE "eliminadoEn" IS NULL
        AND lower(btrim("nombre")) = lower(btrim(${nombre}))
        AND "id" <> ${excluirId ?? 0}
      LIMIT 1`;

    return filas.length > 0;
  }

  async bloquearParaAsignar(id: number): Promise<void> {
    // Compartido: varias asignaciones conviven; un cambio o borrado espera.
    await this.db
      .$queryRaw`SELECT "id" FROM "ServicioInternet" WHERE "id" = ${id} FOR SHARE`;
  }

  async bloquearParaModificar(id: number): Promise<void> {
    await this.db
      .$queryRaw`SELECT "id" FROM "ServicioInternet" WHERE "id" = ${id} FOR UPDATE`;
  }

  async clienteTienePlan(planId: number, clienteId: number): Promise<boolean> {
    const clientes = await this.db.clienteInternet.count({
      where: {
        id: clienteId,
        OR: [
          { servicioInternetId: planId },
          {
            accesosInternet: {
              some: {
                servicioInternetId: planId,
                estado: { not: EstadoAccesoInternet.BAJA },
              },
            },
          },
        ],
      },
    });

    return clientes > 0;
  }

  async contarClientes(id: number): Promise<ClientesDelPlan> {
    const vigentes = { servicioInternetId: id, isEliminado: false };
    const [total, facturables] = await Promise.all([
      this.db.clienteInternet.count({ where: vigentes }),
      this.db.clienteInternet.count({
        where: {
          ...vigentes,
          desinstaladoEn: null,
          estadoCliente: EstadoCliente.ACTIVO,
        },
      }),
    ]);

    return { total, facturables };
  }

  async contarUso(id: number): Promise<UsoPlanInternet> {
    const where = { servicioInternetId: id };
    const [clientes, accesos, instalaciones, desinstalaciones, homologaciones] =
      await Promise.all([
        this.db.clienteInternet.count({ where }),
        this.db.clienteAccesoInternet.count({ where }),
        this.db.clienteInstalacion.count({ where }),
        this.db.clienteDesinstalacion.count({ where }),
        this.db.pppoePerfilHomologacion.count({ where }),
      ]);

    return {
      clientes,
      accesos,
      instalaciones,
      desinstalaciones,
      homologaciones,
    };
  }

  async eliminar(entity: PlanInternetEntity): Promise<void> {
    const props = entity.toPrimitives();

    // Las condiciones repiten la comprobación en la misma sentencia: la base
    // dejaría sin plan a quien lo usara, en vez de impedir el borrado.
    const { count } = await this.db.servicioInternet.updateMany({
      where: {
        id: entity.id!,
        eliminadoEn: null,
        clientes: { none: {} },
        accesosInternet: { none: {} },
        instalacionesCliente: { none: {} },
        desinstalacionesCliente: { none: {} },
        perfilesPppoeHomologados: { none: {} },
      },
      data: {
        estado: PlanInternetPrismaMapper.estadoPersistido(props.estado),
        eliminadoEn: props.eliminadoEn,
        eliminadoPorId: props.eliminadoPorId,
        actualizadoEn: props.actualizadoEn,
      },
    });
    if (count !== 1) throw new PlanInternetModificadoError();
  }
}
