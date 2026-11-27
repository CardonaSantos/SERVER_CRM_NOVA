import { Injectable } from '@nestjs/common';
import { EtiquetaTicket, Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { EtiquetaTicketEntity } from '../../domain/entities/etiqueta-ticket.entity';
import { EtiquetaTicketNombreDuplicadoError } from '../../domain/errors/ticket-soporte.errors';
import { EtiquetaTicketRepositoryPort } from '../../domain/ports/etiqueta-ticket-repository.port';

function aDominio(record: EtiquetaTicket): EtiquetaTicketEntity {
  return EtiquetaTicketEntity.hydrate({
    id: record.id,
    nombre: record.nombre,
    eliminadoEn: record.eliminadoEn,
    eliminadoPorId: record.eliminadoPorId,
  });
}

function traducir(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new EtiquetaTicketNombreDuplicadoError();
  }

  throw error;
}

@Injectable()
export class EtiquetaTicketPrismaRepository
  implements EtiquetaTicketRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async bloquearNombres(): Promise<void> {
    await this.db
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext('EtiquetaTicket.nombre'))`;
  }

  async findByNombre(nombre: string): Promise<EtiquetaTicketEntity | null> {
    // lower() = lower(): "%" y "_" no actúan como comodines.
    const [fila] = await this.db.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM "EtiquetaTicket"
      WHERE lower(btrim(nombre)) = lower(btrim(${nombre}))
      ORDER BY ("eliminadoEn" IS NOT NULL), id
      LIMIT 1`;

    return fila ? this.findById(fila.id) : null;
  }

  async findById(id: number): Promise<EtiquetaTicketEntity | null> {
    const record = await this.db.etiquetaTicket.findUnique({ where: { id } });

    return record ? aDominio(record) : null;
  }

  async create(etiqueta: EtiquetaTicketEntity): Promise<EtiquetaTicketEntity> {
    return this.db.etiquetaTicket
      .create({ data: { nombre: etiqueta.nombre } })
      .then(aDominio, traducir);
  }

  async update(etiqueta: EtiquetaTicketEntity): Promise<EtiquetaTicketEntity> {
    const { id, ...data } = etiqueta.toPrimitives();

    return this.db.etiquetaTicket
      .update({ where: { id: id! }, data })
      .then(aDominio, traducir);
  }
}
