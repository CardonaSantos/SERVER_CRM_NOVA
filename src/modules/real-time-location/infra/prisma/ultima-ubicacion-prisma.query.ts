import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UltimaUbicacionQueryPort } from '../../domain/ports/ultima-ubicacion-query.port';
import { UltimaUbicacionReadModel } from '../../domain/read-models/ultima-ubicacion.read-model';

const SELECT_ULTIMA_UBICACION = {
  usuarioId: true,
  latitud: true,
  longitud: true,
  precision: true,
  velocidad: true,
  bateria: true,
  actualizadoEn: true,
  usuario: {
    select: {
      nombre: true,
      rol: true,
      telefono: true,
      perfil: { select: { avatarUrl: true } },
      ticketsAsignados: {
        where: { estado: 'EN_PROCESO' },
        select: { id: true, titulo: true },
      },
    },
  },
} satisfies Prisma.UbicacionActualSelect;

type UltimaUbicacionRecord = Prisma.UbicacionActualGetPayload<{
  select: typeof SELECT_ULTIMA_UBICACION;
}>;

@Injectable()
export class UltimaUbicacionPrismaQuery implements UltimaUbicacionQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findActualizadasDesde(
    desde: Date,
  ): Promise<UltimaUbicacionReadModel[]> {
    const records = await this.prisma.ubicacionActual.findMany({
      where: { actualizadoEn: { gte: desde } },
      orderBy: { actualizadoEn: 'desc' },
      select: SELECT_ULTIMA_UBICACION,
    });

    return records.map((record) => this.toReadModel(record));
  }

  async findByUsuario(
    usuarioId: number,
  ): Promise<UltimaUbicacionReadModel | null> {
    const record = await this.prisma.ubicacionActual.findUnique({
      where: { usuarioId },
      select: SELECT_ULTIMA_UBICACION,
    });

    return record ? this.toReadModel(record) : null;
  }

  private toReadModel(record: UltimaUbicacionRecord): UltimaUbicacionReadModel {
    return {
      usuarioId: record.usuarioId,
      latitud: record.latitud,
      longitud: record.longitud,
      precision: record.precision,
      velocidad: record.velocidad,
      bateria: record.bateria,
      actualizadoEn: record.actualizadoEn,
      usuario: {
        nombre: record.usuario.nombre,
        rol: record.usuario.rol,
        telefono: record.usuario.telefono,
        avatarUrl: record.usuario.perfil?.avatarUrl ?? null,
      },
      ticketsEnProceso: record.usuario.ticketsAsignados.map((ticket) => ({
        id: ticket.id,
        titulo: ticket.titulo,
      })),
    };
  }
}
