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
import { ESTADOS_RUTA_ABIERTA } from '../../domain/enums/estado-ruta-cobro.enum';
import { OrdenRutaCobro } from '../../domain/enums/orden-ruta-cobro.enum';
import {
  calcularTotalesRuta,
  saldoDeFactura,
  sumarSaldos,
} from '../../domain/policies/totales-ruta.policy';
import { RutaCobroQueryPort } from '../../domain/ports/ruta-cobro-query.port';
import {
  ClienteDeRuta,
  RutaCobroDetalle,
  RutaCobroFiltros,
  RutaCobroResumen,
} from '../../domain/read-models/ruta-cobro.read-model';
import { RutaCobroPrismaMapper } from './ruta-cobro-prisma.mapper';

const CON_DEUDA = {
  estadoFacturaInternet: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'] },
} satisfies Prisma.FacturaInternetWhereInput;

const RUTA = {
  id: true,
  nombreRuta: true,
  estadoRuta: true,
  observaciones: true,
  creadoEn: true,
  actualizadoEn: true,
  cobrador: { select: { id: true, nombre: true, rol: true } },
} satisfies Prisma.RutaSelect;

const SELECT_RESUMEN = {
  ...RUTA,
  clientes: {
    where: { isEliminado: false },
    select: {
      facturaInternet: {
        where: CON_DEUDA,
        select: {
          montoPago: true,
          pagos: { select: { montoPagado: true } },
        },
      },
    },
  },
} satisfies Prisma.RutaSelect;

const SELECT_DETALLE = {
  ...RUTA,
  clientes: {
    where: { isEliminado: false },
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      telefono: true,
      direccion: true,
      contactoReferenciaNombre: true,
      contactoReferenciaTelefono: true,
      estadoCliente: true,
      fechaInstalacion: true,
      observaciones: true,
      facturacionZona: { select: { id: true, nombre: true } },
      sector: { select: { nombre: true } },
      servicioInternet: { select: { nombre: true } },
      ubicacion: { select: { latitud: true, longitud: true } },
      PagoFacturaInternet: {
        select: { fechaPago: true },
        orderBy: { fechaPago: 'desc' },
        take: 1,
      },
      facturaInternet: {
        where: CON_DEUDA,
        orderBy: [{ periodo: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          periodo: true,
          montoPago: true,
          estadoFacturaInternet: true,
          detalleFactura: true,
          creadoEn: true,
          fechaPagoEsperada: true,
          pagos: { select: { montoPagado: true } },
        },
      },
    },
  },
} satisfies Prisma.RutaSelect;

type RegistroResumen = Prisma.RutaGetPayload<{ select: typeof SELECT_RESUMEN }>;
type RegistroCliente = Prisma.RutaGetPayload<{
  select: typeof SELECT_DETALLE;
}>['clientes'][number];

type Cobros = Map<number, { clienteId: number; monto: number }[]>;

const ORDEN: Record<
  OrdenRutaCobro,
  (dir: DireccionOrden) => Prisma.RutaOrderByWithRelationInput
> = {
  [OrdenRutaCobro.NOMBRE]: (dir) => ({ nombreRuta: dir }),
  [OrdenRutaCobro.CREADO_EN]: (dir) => ({ creadoEn: dir }),
  [OrdenRutaCobro.ACTUALIZADO_EN]: (dir) => ({ actualizadoEn: dir }),
};

@Injectable()
export class RutaCobroPrismaQuery implements RutaCobroQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filtros: RutaCobroFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<RutaCobroResumen>> {
    const where = this.construirWhere(filtros);
    const sortBy = filtros.sortBy ?? OrdenRutaCobro.CREADO_EN;
    const dir = filtros.sortDir ?? 'desc';

    const [records, total] = await this.prisma.$transaction([
      this.prisma.ruta.findMany({
        where,
        select: SELECT_RESUMEN,
        orderBy: [ORDEN[sortBy](dir), { id: dir }],
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.ruta.count({ where }),
    ]);

    return crearResultadoPaginado(
      await this.resumenes(records),
      total,
      paginacion,
    );
  }

  async findAsignadas(cobradorId: number): Promise<RutaCobroResumen[]> {
    const records = await this.prisma.ruta.findMany({
      where: this.construirWhere({
        cobradorId,
        estados: [...ESTADOS_RUTA_ABIERTA],
      }),
      select: SELECT_RESUMEN,
      orderBy: [{ actualizadoEn: 'desc' }, { id: 'desc' }],
    });

    return this.resumenes(records);
  }

  async findDetalle(id: number): Promise<RutaCobroDetalle | null> {
    const record = await this.prisma.ruta.findFirst({
      where: { id, eliminadoEn: null },
      select: SELECT_DETALLE,
    });
    if (!record) return null;

    const cobros = await this.cobros([id]);
    const clientes = record.clientes.map((c) => this.cliente(c));

    return {
      ...this.encabezado(record),
      totales: calcularTotalesRuta({
        saldosPorCliente: clientes.map((c) =>
          c.facturas.map((f) => f.saldoPendiente),
        ),
        cobros: cobros.get(id) ?? [],
      }),
      // Estable: a igual saldo se mantiene el orden por nombre.
      clientes: clientes.sort((a, b) => b.saldoPendiente - a.saldoPendiente),
    };
  }

  private construirWhere(filtros: RutaCobroFiltros): Prisma.RutaWhereInput {
    return {
      eliminadoEn: null,
      ...(filtros.estados?.length && {
        estadoRuta: {
          in: filtros.estados.map((e) => RutaCobroPrismaMapper.estadoPrisma(e)),
        },
      }),
      ...(filtros.cobradorId && { cobradorId: filtros.cobradorId }),
      ...(filtros.search && {
        nombreRuta: { contains: filtros.search, mode: 'insensitive' },
      }),
    };
  }

  private async resumenes(
    records: RegistroResumen[],
  ): Promise<RutaCobroResumen[]> {
    const cobros = await this.cobros(records.map((r) => r.id));

    return records.map((record) => ({
      ...this.encabezado(record),
      totales: calcularTotalesRuta({
        saldosPorCliente: record.clientes.map((cliente) =>
          cliente.facturaInternet.map((f) => this.saldo(f)),
        ),
        cobros: cobros.get(record.id) ?? [],
      }),
    }));
  }

  /** Lo cobrado de cada ruta por cliente, en una sola consulta. */
  private async cobros(rutaIds: number[]): Promise<Cobros> {
    const mapa: Cobros = new Map();
    if (rutaIds.length === 0) return mapa;

    const grupos = await this.prisma.pagoFacturaInternet.groupBy({
      by: ['rutaId', 'clienteId'],
      where: { rutaId: { in: rutaIds } },
      _sum: { montoPagado: true },
    });

    for (const grupo of grupos) {
      const lista = mapa.get(grupo.rutaId!) ?? [];
      lista.push({
        clienteId: grupo.clienteId,
        monto: grupo._sum.montoPagado ?? 0,
      });
      mapa.set(grupo.rutaId!, lista);
    }

    return mapa;
  }

  private encabezado(
    record: Omit<RegistroResumen, 'clientes'>,
  ): Omit<RutaCobroResumen, 'totales'> {
    return {
      id: record.id,
      nombre: record.nombreRuta,
      estado: RutaCobroPrismaMapper.estado(record.estadoRuta),
      observaciones: record.observaciones,
      cobrador: record.cobrador && {
        id: record.cobrador.id,
        nombre: record.cobrador.nombre,
        rol: record.cobrador.rol,
      },
      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
    };
  }

  private saldo(factura: {
    montoPago: number | null;
    pagos: { montoPagado: number }[];
  }): number {
    return saldoDeFactura(
      factura.montoPago ?? 0,
      factura.pagos.map((p) => p.montoPagado),
    );
  }

  private cliente(c: RegistroCliente): ClienteDeRuta {
    const facturas = c.facturaInternet.map((f) => ({
      id: f.id,
      periodo: f.periodo,
      montoPago: f.montoPago ?? 0,
      saldoPendiente: this.saldo(f),
      estado: f.estadoFacturaInternet,
      detalleFactura: f.detalleFactura,
      creadoEn: f.creadoEn,
      fechaPagoEsperada: f.fechaPagoEsperada,
    }));
    const { latitud, longitud } = c.ubicacion ?? {};

    return {
      id: c.id,
      nombre: c.nombre,
      apellidos: c.apellidos,
      telefono: c.telefono,
      direccion: c.direccion,
      contactoReferencia: {
        nombre: c.contactoReferenciaNombre,
        telefono: c.contactoReferenciaTelefono,
      },
      estadoCliente: c.estadoCliente,
      zonaFacturacion: c.facturacionZona,
      sector: c.sector?.nombre ?? null,
      plan: c.servicioInternet?.nombre ?? null,
      fechaInstalacion: c.fechaInstalacion,
      observaciones: c.observaciones,
      ubicacion:
        latitud != null && longitud != null ? { latitud, longitud } : null,
      saldoPendiente: sumarSaldos(facturas.map((f) => f.saldoPendiente)),
      ultimoPago: c.PagoFacturaInternet[0]?.fechaPago ?? null,
      facturas,
    };
  }
}
