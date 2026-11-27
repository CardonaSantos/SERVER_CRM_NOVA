import { Injectable } from '@nestjs/common';
import { Prisma, SolucionTicket } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { SolucionTicketEntity } from '../../domain/entities/solucion-ticket.entity';
import { SolucionTicketNombreDuplicadoError } from '../../domain/errors/ticket-soporte.errors';
import { SolucionTicketRepositoryPort } from '../../domain/ports/solucion-ticket-repository.port';

function aDominio(record: SolucionTicket): SolucionTicketEntity {
  return SolucionTicketEntity.hydrate({
    id: record.id,
    nombre: record.solucion,
    descripcion: record.descripcion,
    eliminada: record.isEliminado,
  });
}

function aPersistencia(solucion: SolucionTicketEntity) {
  const { nombre, descripcion, eliminada } = solucion.toPrimitives();

  return { solucion: nombre, descripcion, isEliminado: eliminada };
}

function traducir(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new SolucionTicketNombreDuplicadoError();
  }

  throw error;
}

@Injectable()
export class SolucionTicketPrismaRepository
  implements SolucionTicketRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async bloquearNombres(): Promise<void> {
    await this.db
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext('SolucionTicket.solucion'))`;
  }

  async findByNombre(nombre: string): Promise<SolucionTicketEntity | null> {
    const [fila] = await this.db.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM "SolucionTicket"
      WHERE lower(btrim(solucion)) = lower(btrim(${nombre}))
      ORDER BY "isEliminado", id
      LIMIT 1`;

    return fila ? this.findById(fila.id) : null;
  }

  async findById(id: number): Promise<SolucionTicketEntity | null> {
    const record = await this.db.solucionTicket.findUnique({ where: { id } });

    return record ? aDominio(record) : null;
  }

  async create(solucion: SolucionTicketEntity): Promise<SolucionTicketEntity> {
    return this.db.solucionTicket
      .create({ data: aPersistencia(solucion) })
      .then(aDominio, traducir);
  }

  async update(solucion: SolucionTicketEntity): Promise<SolucionTicketEntity> {
    return this.db.solucionTicket
      .update({ where: { id: solucion.id! }, data: aPersistencia(solucion) })
      .then(aDominio, traducir);
  }
}
