import { Injectable } from '@nestjs/common';
import { EstadoEnvioMensaje, Prisma } from '@prisma/client';
import {
  aDesplazamiento,
  crearResultadoPaginado,
  Paginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { PrismaService } from 'src/prisma/prisma.service';
import { CampaniaQueryPort } from '../../domain/ports/campania-query.port';
import {
  CampaniaReadModel,
  EnvioFiltros,
  EnvioListItem,
  TotalesCampania,
} from '../../domain/read-models/campania.read-model';
import { CampaniaPrismaMapper } from './campania-prisma.mapper';

const SELECT_CAMPANIA = {
  id: true,
  plantilla: true,
  idioma: true,
  imagenUrl: true,
  estado: true,
  creadoEn: true,
  actividadEn: true,
  finalizadaEn: true,
  creadoPor: { select: { id: true, nombre: true } },
} satisfies Prisma.CampaniaMensajeSelect;

type CampaniaRecord = Prisma.CampaniaMensajeGetPayload<{
  select: typeof SELECT_CAMPANIA;
}>;

const CLAVE_TOTAL: Record<
  EstadoEnvioMensaje,
  Exclude<keyof TotalesCampania, 'total'>
> = {
  PENDIENTE: 'pendientes',
  ENVIANDO: 'pendientes',
  ENVIADO: 'enviados',
  FALLIDO: 'fallidos',
  OMITIDO: 'omitidos',
  SIN_CONFIRMAR: 'sinConfirmar',
};

@Injectable()
export class CampaniaPrismaQuery implements CampaniaQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<CampaniaReadModel>> {
    const [records, total] = await this.prisma.$transaction([
      this.prisma.campaniaMensaje.findMany({
        orderBy: { id: 'desc' },
        select: SELECT_CAMPANIA,
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.campaniaMensaje.count(),
    ]);

    return crearResultadoPaginado(
      await this.conTotales(records),
      total,
      paginacion,
    );
  }

  async findDetail(id: number): Promise<CampaniaReadModel | null> {
    const record = await this.prisma.campaniaMensaje.findUnique({
      where: { id },
      select: SELECT_CAMPANIA,
    });
    if (!record) return null;

    const [campania] = await this.conTotales([record]);
    return campania;
  }

  async findEnvios(
    campaniaId: number,
    filtros: EnvioFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<EnvioListItem>> {
    const where: Prisma.EnvioCampaniaMensajeWhereInput = {
      campaniaId,
      estado: filtros.estado,
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.envioCampaniaMensaje.findMany({
        where,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          clienteId: true,
          telefono: true,
          estado: true,
          motivo: true,
          detalle: true,
          intentadoEn: true,
          cliente: { select: { nombre: true, apellidos: true } },
        },
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.envioCampaniaMensaje.count({ where }),
    ]);

    return crearResultadoPaginado(
      records.map((r) => ({
        id: r.id,
        clienteId: r.clienteId,
        cliente: `${r.cliente.nombre} ${r.cliente.apellidos ?? ''}`.trim(),
        telefono: r.telefono,
        estado: CampaniaPrismaMapper.estadoEnvio(r.estado),
        motivo: r.motivo,
        detalle: r.detalle,
        intentadoEn: r.intentadoEn,
      })),
      total,
      paginacion,
    );
  }

  /** Una sola consulta para los totales de todas las campañas pedidas. */
  private async conTotales(
    records: CampaniaRecord[],
  ): Promise<CampaniaReadModel[]> {
    const grupos = await this.prisma.envioCampaniaMensaje.groupBy({
      by: ['campaniaId', 'estado'],
      where: { campaniaId: { in: records.map((r) => r.id) } },
      _count: { _all: true },
    });

    return records.map((record) => {
      const totales: TotalesCampania = {
        total: 0,
        pendientes: 0,
        enviados: 0,
        fallidos: 0,
        omitidos: 0,
        sinConfirmar: 0,
      };
      for (const grupo of grupos) {
        if (grupo.campaniaId !== record.id) continue;
        totales[CLAVE_TOTAL[grupo.estado]] += grupo._count._all;
        totales.total += grupo._count._all;
      }
      return {
        ...record,
        estado: CampaniaPrismaMapper.estado(record.estado),
        totales,
      };
    });
  }
}
