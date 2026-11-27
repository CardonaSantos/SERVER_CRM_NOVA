import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  aDesplazamiento,
  crearResultadoPaginado,
  Paginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ESTADOS_CON_DEUDA,
  EstadoFactura,
} from '../../domain/enums/estado-factura.enum';
import { MetodoPago } from '../../domain/enums/metodo-pago.enum';
import { redondear, sumar } from '../../domain/policies/dinero.policy';
import { FacturaQueryPort } from '../../domain/ports/factura-query.port';
import {
  FacturaDetalle,
  FacturaEdicion,
  FacturaEliminadaItem,
  FacturaFiltros,
  FacturaImpresion,
  FacturaListItem,
  ResumenFacturas,
} from '../../domain/read-models/factura.read-model';
import { FacturaPrismaMapper } from './factura-prisma.mapper';

const USUARIO = { select: { id: true, nombre: true, rol: true } } as const;

const PAGO = {
  id: true,
  montoPagado: true,
  metodoPago: true,
  numeroBoleta: true,
  fechaPago: true,
  creadoEn: true,
} satisfies Prisma.PagoFacturaInternetSelect;

const CON_DEUDA = ESTADOS_CON_DEUDA.map((e) => FacturaPrismaMapper.estado(e));

const estado = (valor: string) => valor as EstadoFactura;
const metodo = (valor: string) => valor as MetodoPago;

@Injectable()
export class FacturaPrismaQuery implements FacturaQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filtros: FacturaFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<FacturaListItem>> {
    const where = this.construirWhere(filtros);

    const [records, total] = await this.prisma.$transaction([
      this.prisma.facturaInternet.findMany({
        where,
        orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
        ...aDesplazamiento(paginacion),
        select: {
          id: true,
          estadoFacturaInternet: true,
          montoPago: true,
          saldoPendiente: true,
          creadoEn: true,
          fechaPagoEsperada: true,
          facturacionZonaId: true,
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              municipioId: true,
              departamentoId: true,
              sector: { select: { id: true, nombre: true } },
              IP: { select: { direccionIp: true } },
            },
          },
          pagos: { select: { cobrador: { select: { nombre: true } } } },
        },
      }),
      this.prisma.facturaInternet.count({ where }),
    ]);

    const items = records.map((r) => ({
      id: r.id,
      estado: estado(r.estadoFacturaInternet),
      cliente: {
        id: r.cliente.id,
        nombre: `${r.cliente.nombre} ${r.cliente.apellidos ?? ''}`.trim(),
        telefono: r.cliente.telefono,
      },
      direccionIp: r.cliente.IP?.direccionIp ?? null,
      sector: r.cliente.sector,
      municipioId: r.cliente.municipioId,
      departamentoId: r.cliente.departamentoId,
      facturacionZonaId: r.facturacionZonaId,
      montoPago: r.montoPago ?? 0,
      saldoPendiente: r.saldoPendiente ?? 0,
      creadoEn: r.creadoEn,
      fechaPagoEsperada: r.fechaPagoEsperada,
      cobradores: [
        ...new Set(
          r.pagos.flatMap((p) => (p.cobrador ? [p.cobrador.nombre] : [])),
        ),
      ],
    }));

    return crearResultadoPaginado(items, total, paginacion);
  }

  async resumir(filtros: FacturaFiltros): Promise<ResumenFacturas> {
    const base = this.construirWhere({ ...filtros, estado: undefined });
    const contar = (condicion: Prisma.FacturaInternetWhereInput) =>
      this.prisma.facturaInternet.count({ where: { AND: [base, condicion] } });

    const [cobradas, porCobrar] = await this.prisma.$transaction([
      contar({ estadoFacturaInternet: 'PAGADA' }),
      contar({ estadoFacturaInternet: { in: CON_DEUDA } }),
    ]);

    return { facturadas: cobradas + porCobrar, cobradas, porCobrar };
  }

  async findDetalle(id: number): Promise<FacturaDetalle | null> {
    const r = await this.prisma.facturaInternet.findUnique({
      where: { id },
      select: {
        id: true,
        estadoFacturaInternet: true,
        periodo: true,
        montoPago: true,
        saldoPendiente: true,
        detalleFactura: true,
        creadoEn: true,
        fechaPagoEsperada: true,
        fechaPagada: true,
        creador: USUARIO,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            direccion: true,
            dpi: true,
            estadoCliente: true,
            servicioInternet: {
              select: {
                id: true,
                nombre: true,
                velocidad: true,
                precio: true,
              },
            },
            facturacionZona: { select: { id: true, nombre: true } },
          },
        },
        pagos: {
          select: { ...PAGO, cobrador: USUARIO },
          orderBy: { fechaPago: 'asc' },
        },
        RecordatorioPago: {
          select: { id: true, creadoEn: true, tipo: true },
          orderBy: { creadoEn: 'asc' },
        },
      },
    });
    if (!r) return null;

    const pendientes = await this.prisma.facturaInternet.findMany({
      where: {
        clienteId: r.cliente.id,
        id: { not: r.id },
        estadoFacturaInternet: { in: CON_DEUDA },
      },
      select: {
        id: true,
        estadoFacturaInternet: true,
        montoPago: true,
        saldoPendiente: true,
        fechaPagoEsperada: true,
      },
      orderBy: { creadoEn: 'desc' },
    });

    return {
      id: r.id,
      estado: estado(r.estadoFacturaInternet),
      periodo: r.periodo,
      montoPago: r.montoPago ?? 0,
      saldoPendiente: r.saldoPendiente ?? 0,
      detalleFactura: r.detalleFactura,
      creadoEn: r.creadoEn,
      fechaPagoEsperada: r.fechaPagoEsperada,
      fechaPagada: r.fechaPagada,
      creador: r.creador,
      cliente: r.cliente,
      pagos: r.pagos.map((p) => ({ ...p, metodoPago: metodo(p.metodoPago) })),
      recordatorios: r.RecordatorioPago.map((aviso) => ({
        id: aviso.id,
        fechaEnvio: aviso.creadoEn,
        medioEnvio: aviso.tipo,
      })),
      facturasPendientes: pendientes.map((f) => ({
        id: f.id,
        estado: estado(f.estadoFacturaInternet),
        montoPago: f.montoPago ?? 0,
        saldoPendiente: f.saldoPendiente ?? 0,
        fechaPagoEsperada: f.fechaPagoEsperada,
      })),
    };
  }

  async findImpresion(id: number): Promise<FacturaImpresion | null> {
    const r = await this.prisma.facturaInternet.findUnique({
      where: { id },
      select: {
        id: true,
        estadoFacturaInternet: true,
        periodo: true,
        montoPago: true,
        detalleFactura: true,
        creadoEn: true,
        fechaPagoEsperada: true,
        cliente: {
          select: { id: true, nombre: true, apellidos: true, dpi: true },
        },
        empresa: {
          select: {
            nombre: true,
            direccion: true,
            correo: true,
            pbx: true,
            sitioWeb: true,
            telefono: true,
            nit: true,
          },
        },
        pagos: { select: PAGO, orderBy: { fechaPago: 'asc' } },
      },
    });
    if (!r) return null;

    const monto = r.montoPago ?? 0;

    return {
      id: r.id,
      estado: estado(r.estadoFacturaInternet),
      periodo: r.periodo,
      montoPago: monto,
      saldoPendiente: redondear(
        monto - sumar(r.pagos.map((p) => p.montoPagado)),
      ),
      detalleFactura: r.detalleFactura,
      creadoEn: r.creadoEn,
      fechaPagoEsperada: r.fechaPagoEsperada,
      cliente: r.cliente,
      empresa: r.empresa,
      pagos: r.pagos.map((p) => ({ ...p, metodoPago: metodo(p.metodoPago) })),
    };
  }

  async findEdicion(id: number): Promise<FacturaEdicion | null> {
    const r = await this.prisma.facturaInternet.findUnique({
      where: { id },
      select: {
        id: true,
        estadoFacturaInternet: true,
        montoPago: true,
        saldoPendiente: true,
        detalleFactura: true,
        creadoEn: true,
        actualizadoEn: true,
        fechaPagoEsperada: true,
        fechaPagada: true,
        pagos: { select: { montoPagado: true } },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            estadoCliente: true,
          },
        },
      },
    });
    if (!r) return null;

    return {
      id: r.id,
      estado: estado(r.estadoFacturaInternet),
      montoPago: r.montoPago ?? 0,
      saldoPendiente: r.saldoPendiente ?? 0,
      totalPagado: sumar(r.pagos.map((p) => p.montoPagado)),
      detalleFactura: r.detalleFactura,
      creadoEn: r.creadoEn,
      actualizadoEn: r.actualizadoEn,
      fechaPagoEsperada: r.fechaPagoEsperada,
      fechaPagada: r.fechaPagada,
      cliente: r.cliente,
    };
  }

  async findEliminadas(
    search: string | undefined,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<FacturaEliminadaItem>> {
    const where: Prisma.FacturaEliminadaWhereInput = search
      ? {
          OR: [
            { motivo: { contains: search, mode: 'insensitive' } },
            { periodo: { contains: search } },
          ],
        }
      : {};

    const [records, total] = await this.prisma.$transaction([
      this.prisma.facturaEliminada.findMany({
        where,
        orderBy: [{ fechaEliminacion: 'desc' }, { id: 'desc' }],
        ...aDesplazamiento(paginacion),
        include: { usuario: USUARIO },
      }),
      this.prisma.facturaEliminada.count({ where }),
    ]);

    const items = records.map((r) => ({
      id: r.id,
      facturaId: r.facturaOriginalId ?? r.facturaInternetId,
      clienteId: r.clienteId,
      periodo: r.periodo,
      montoPago: r.montoPago,
      fechaPagoEsperada: r.fechaPagoEsperada,
      fechaEliminacion: r.fechaEliminacion,
      motivo: r.motivo,
      usuario: r.usuario,
    }));

    return crearResultadoPaginado(items, total, paginacion);
  }

  private construirWhere(
    filtros: FacturaFiltros,
  ): Prisma.FacturaInternetWhereInput {
    const palabras = filtros.search?.split(/\s+/).filter(Boolean) ?? [];
    const contiene = (texto: string) => ({
      contains: texto,
      mode: 'insensitive' as const,
    });

    return {
      facturacionZonaId: filtros.zonaId,
      estadoFacturaInternet: filtros.estado
        ? FacturaPrismaMapper.estado(filtros.estado)
        : undefined,
      cliente: {
        municipioId: filtros.municipioId,
        departamentoId: filtros.departamentoId,
        sectorId: filtros.sectorId,
      },
      AND: palabras.map((palabra) => ({
        cliente: {
          OR: [
            { nombre: contiene(palabra) },
            { apellidos: contiene(palabra) },
            { telefono: contiene(palabra) },
            { direccion: contiene(palabra) },
            { IP: { direccionIp: contiene(palabra) } },
            { sector: { nombre: contiene(palabra) } },
          ],
        },
      })),
    };
  }
}
