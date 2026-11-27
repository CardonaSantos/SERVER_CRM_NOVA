import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  aDesplazamiento,
  crearResultadoPaginado,
  DireccionOrden,
  Paginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdenZonaFacturacion } from '../../domain/enums/orden-zona-facturacion.enum';
import { ZonaFacturacionQueryPort } from '../../domain/ports/zona-facturacion-query.port';
import {
  ZonaFacturacionFiltros,
  ZonaFacturacionListItem,
  ZonaFacturacionOpcion,
} from '../../domain/read-models/zona-facturacion-listado.read-model';
import { ZonaFacturacionPrismaMapper } from './zona-facturacion-prisma.mapper';

const CONTEOS = {
  select: {
    clientes: { where: { isEliminado: false } },
    facturas: true,
  },
} satisfies Prisma.FacturacionZonaCountOutputTypeDefaultArgs;

const ORDEN: Record<
  OrdenZonaFacturacion,
  (dir: DireccionOrden) => Prisma.FacturacionZonaOrderByWithRelationInput
> = {
  [OrdenZonaFacturacion.NOMBRE]: (dir) => ({ nombre: dir }),
  [OrdenZonaFacturacion.DIA_GENERACION_FACTURA]: (dir) => ({
    diaGeneracionFactura: dir,
  }),
  [OrdenZonaFacturacion.DIA_PAGO]: (dir) => ({ diaPago: dir }),
  [OrdenZonaFacturacion.CREADO_EN]: (dir) => ({ creadoEn: dir }),
};

@Injectable()
export class ZonaFacturacionPrismaQuery implements ZonaFacturacionQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filtros: ZonaFacturacionFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ZonaFacturacionListItem>> {
    const where = this.construirWhere(filtros);
    const dir = filtros.sortDir ?? 'asc';

    const [records, total] = await this.prisma.$transaction([
      this.prisma.facturacionZona.findMany({
        where,
        include: { _count: CONTEOS },
        orderBy: [
          ...(filtros.sortBy ? [ORDEN[filtros.sortBy](dir)] : []),
          { id: filtros.sortBy ? 'asc' : dir },
        ],
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.facturacionZona.count({ where }),
    ]);

    const items = records.map((record) => ({
      ...ZonaFacturacionPrismaMapper.configuracion(record),
      id: record.id,
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
      clientes: record._count.clientes,
      facturas: record._count.facturas,
    }));

    return crearResultadoPaginado(items, total, paginacion);
  }

  async findOpciones(): Promise<ZonaFacturacionOpcion[]> {
    const records = await this.prisma.facturacionZona.findMany({
      where: this.construirWhere({}),
      select: { id: true, nombre: true, _count: CONTEOS },
      orderBy: { id: 'asc' },
    });

    return records.map((record) => ({
      id: record.id,
      nombre: record.nombre,
      clientes: record._count.clientes,
      facturas: record._count.facturas,
    }));
  }

  private construirWhere(
    filtros: ZonaFacturacionFiltros,
  ): Prisma.FacturacionZonaWhereInput {
    return {
      eliminadoEn: null,
      ...(filtros.search && {
        nombre: { contains: filtros.search, mode: 'insensitive' },
      }),
    };
  }
}
