import { Injectable } from '@nestjs/common';
import { EstadoCliente, EstadoCobranzaCliente, Prisma } from '@prisma/client';
import {
  aDesplazamiento,
  crearResultadoPaginado,
  Paginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { PrismaService } from 'src/prisma/prisma.service';
import { conCobranza } from 'src/Utils/filtro-cobranza';
import { normalizarBusqueda } from '../../domain/policies/nombre-busqueda.policy';
import {
  calcularSaldo,
  ESTADOS_FACTURA_CON_DEUDA,
} from '../../domain/policies/saldo.policy';
import { ClienteListadoQueryPort } from '../../domain/ports/cliente-listado-query.port';
import {
  ClienteCampaniaFiltros,
  ClienteCampaniaItem,
  ClienteOpcion,
  ClienteRutaFiltros,
  ClienteRutaItem,
  ClienteTablaFiltros,
  ClienteTablaItem,
  ResumenCartera,
} from '../../domain/read-models/cliente-listado.read-model';

const NOMBRADO = { select: { id: true, nombre: true } } as const;

const SELECT_TABLA = {
  id: true,
  nombre: true,
  apellidos: true,
  telefono: true,
  dpi: true,
  direccion: true,
  creadoEn: true,
  actualizadoEn: true,
  estadoCliente: true,
  estadoCobranza: true,
  sector: NOMBRADO,
  departamento: NOMBRADO,
  municipio: NOMBRADO,
  facturacionZona: NOMBRADO,
  IP: { select: { direccionIp: true } },
  servicioInternet: {
    select: {
      id: true,
      nombre: true,
      velocidad: true,
      precio: true,
      estado: true,
    },
  },
  facturaInternet: {
    select: {
      id: true,
      estadoFacturaInternet: true,
      creadoEn: true,
      fechaPagoEsperada: true,
      fechaPagada: true,
      pagos: { select: { id: true, fechaPago: true, montoPagado: true } },
    },
  },
} satisfies Prisma.ClienteInternetSelect;

const FACTURAS_CON_DEUDA = {
  where: { estadoFacturaInternet: { in: [...ESTADOS_FACTURA_CON_DEUDA] } },
  select: {
    id: true,
    estadoFacturaInternet: true,
    montoPago: true,
    fechaPagoEsperada: true,
    pagos: { select: { montoPagado: true, fechaPago: true } },
  },
} satisfies Prisma.FacturaInternetFindManyArgs;

const SELECT_RUTA = {
  id: true,
  nombre: true,
  apellidos: true,
  telefono: true,
  direccion: true,
  estadoCliente: true,
  estadoCobranza: true,
  municipio: NOMBRADO,
  sector: NOMBRADO,
  facturacionZona: NOMBRADO,
  facturaInternet: FACTURAS_CON_DEUDA,
} satisfies Prisma.ClienteInternetSelect;

type RutaRecord = Prisma.ClienteInternetGetPayload<{
  select: typeof SELECT_RUTA;
}>;

@Injectable()
export class ClienteListadoPrismaQuery implements ClienteListadoQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findTabla(
    filtros: ClienteTablaFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ClienteTablaItem>> {
    const where = this.construirWhereTabla(filtros);

    const [records, total] = await this.prisma.$transaction([
      this.prisma.clienteInternet.findMany({
        where,
        orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
        ...aDesplazamiento(paginacion),
        select: SELECT_TABLA,
      }),
      this.prisma.clienteInternet.count({ where }),
    ]);

    const items = records.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      apellidos: r.apellidos,
      estadoCliente: r.estadoCliente,
      estadoCobranza: r.estadoCobranza,
      telefono: r.telefono,
      dpi: r.dpi,
      direccion: r.direccion,
      creadoEn: r.creadoEn,
      actualizadoEn: r.actualizadoEn,
      departamento: r.departamento,
      municipio: r.municipio,
      sector: r.sector,
      facturacionZona: r.facturacionZona,
      direccionIp: r.IP?.direccionIp ?? null,
      servicioInternet: r.servicioInternet,
      facturas: r.facturaInternet.map((f) => ({
        id: f.id,
        creadoEn: f.creadoEn,
        fechaPagoEsperada: f.fechaPagoEsperada,
        fechaPagada: f.fechaPagada,
        estado: f.estadoFacturaInternet,
        pagos: f.pagos,
      })),
    }));

    return crearResultadoPaginado(items, total, paginacion);
  }

  async contarCartera(): Promise<ResumenCartera> {
    const [activos, pagoPendiente, atrasados, morosos] =
      await this.prisma.$transaction([
        this.prisma.clienteInternet.count({
          where: { isEliminado: false, estadoCliente: EstadoCliente.ACTIVO },
        }),
        this.prisma.clienteInternet.count({
          where: conCobranza(EstadoCobranzaCliente.PAGO_PENDIENTE),
        }),
        this.prisma.clienteInternet.count({
          where: conCobranza(EstadoCobranzaCliente.ATRASADO),
        }),
        this.prisma.clienteInternet.count({
          where: conCobranza(EstadoCobranzaCliente.MOROSO),
        }),
      ]);

    return { activos, pagoPendiente, atrasados, morosos };
  }

  async findParaRuta(
    filtros: ClienteRutaFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ClienteRutaItem>> {
    const where = this.construirWhereRuta(filtros);
    const { skip, take } = aDesplazamiento(paginacion);

    if (filtros.sortBy === 'saldo') {
      // El saldo no es una columna: se calcula para todos y luego se pagina.
      const todos = await this.prisma.clienteInternet.findMany({
        where,
        orderBy: { id: 'asc' },
        select: SELECT_RUTA,
      });
      const signo = filtros.sortDir === 'asc' ? 1 : -1;
      const ordenados = todos
        .map((r) => this.aItemRuta(r))
        .sort(
          (a, b) =>
            signo * (a.saldoPendiente - b.saldoPendiente) || a.id - b.id,
        );

      return crearResultadoPaginado(
        ordenados.slice(skip, skip + take),
        ordenados.length,
        paginacion,
      );
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.clienteInternet.findMany({
        where,
        orderBy: [
          { nombre: filtros.sortDir },
          { apellidos: filtros.sortDir },
          { id: 'asc' },
        ],
        skip,
        take,
        select: SELECT_RUTA,
      }),
      this.prisma.clienteInternet.count({ where }),
    ]);

    return crearResultadoPaginado(
      records.map((r) => this.aItemRuta(r)),
      total,
      paginacion,
    );
  }

  async findParaCampania(
    filtros: ClienteCampaniaFiltros,
  ): Promise<ClienteCampaniaItem[]> {
    const where: Prisma.ClienteInternetWhereInput = {
      isEliminado: false,
      departamentoId: filtros.departamentoId,
      municipioId: filtros.municipioId,
      sectorId: filtros.sectorId,
      facturacionZonaId: filtros.zonaId,
      estadoCliente: filtros.estado as EstadoCliente | undefined,
      estadoCobranza: filtros.estadoCobranza as
        | EstadoCobranzaCliente
        | undefined,
      ...(filtros.nombre && {
        searchNombre: { contains: normalizarBusqueda(filtros.nombre) },
      }),
    };

    if (filtros.facturasPendientes !== undefined) {
      Object.assign(
        where,
        await this.conCantidadDeDeudas(filtros.facturasPendientes),
      );
    }

    const records = await this.prisma.clienteInternet.findMany({
      where,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        telefono: true,
        estadoCliente: true,
        estadoCobranza: true,
        contactoReferenciaTelefono: true,
        _count: {
          select: {
            facturaInternet: { where: FACTURAS_CON_DEUDA.where },
          },
        },
      },
    });

    return records.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      apellidos: r.apellidos,
      facturasPendientes: r._count.facturaInternet,
      estadoCliente: r.estadoCliente,
      estadoCobranza: r.estadoCobranza,
      telefono: r.telefono,
      telefonoReferencia: r.contactoReferenciaTelefono,
    }));
  }

  findOpciones(): Promise<ClienteOpcion[]> {
    return this.prisma.clienteInternet.findMany({
      where: { isEliminado: false },
      orderBy: [{ nombre: 'asc' }, { apellidos: 'asc' }],
      select: { id: true, nombre: true, apellidos: true },
    });
  }

  private async conCantidadDeDeudas(
    cantidad: number,
  ): Promise<Prisma.ClienteInternetWhereInput> {
    if (cantidad === 0) {
      return { facturaInternet: { none: FACTURAS_CON_DEUDA.where } };
    }

    const grupos = await this.prisma.facturaInternet.groupBy({
      by: ['clienteId'],
      where: FACTURAS_CON_DEUDA.where,
      having: { id: { _count: { equals: cantidad } } },
    });

    return { id: { in: grupos.map((g) => g.clienteId) } };
  }

  /** Cada palabra buscada debe aparecer en alguna de estas columnas. */
  private construirWhereTabla(
    filtros: ClienteTablaFiltros,
  ): Prisma.ClienteInternetWhereInput {
    const terminos = normalizarBusqueda(filtros.search ?? '')
      .split(' ')
      .filter(Boolean);
    const contiene = (texto: string) => ({
      contains: texto,
      mode: 'insensitive' as const,
    });

    return {
      isEliminado: false,
      facturacionZonaId: filtros.zonaId,
      municipioId: filtros.municipioId,
      departamentoId: filtros.departamentoId,
      sectorId: filtros.sectorId,
      estadoCliente: filtros.estado as EstadoCliente | undefined,
      estadoCobranza: filtros.estadoCobranza as
        | EstadoCobranzaCliente
        | undefined,
      AND: terminos.map((termino) => ({
        OR: [
          { searchNombre: contiene(termino) },
          { telefono: contiene(termino) },
          { IP: { direccionIp: contiene(termino) } },
          { sector: { nombre: contiene(termino) } },
          { direccion: contiene(termino) },
        ],
      })),
    };
  }

  /** Aquí la búsqueda es solo por nombre, con el texto completo. */
  private construirWhereRuta(
    filtros: ClienteRutaFiltros,
  ): Prisma.ClienteInternetWhereInput {
    const busqueda = normalizarBusqueda(filtros.search ?? '');

    return {
      isEliminado: false,
      estadoCliente: filtros.estado as EstadoCliente | undefined,
      estadoCobranza: filtros.estadoCobranza as
        | EstadoCobranzaCliente
        | undefined,
      ...(filtros.zonaIds?.length && {
        facturacionZonaId: { in: filtros.zonaIds },
      }),
      ...(filtros.sectorIds?.length && {
        sectorId: { in: filtros.sectorIds },
      }),
      ...(busqueda && { searchNombre: { contains: busqueda } }),
    };
  }

  private aItemRuta(r: RutaRecord): ClienteRutaItem {
    const facturas = r.facturaInternet.map((f) => ({
      id: f.id,
      estado: f.estadoFacturaInternet,
      monto: Number(f.montoPago ?? 0),
      fechaPagoEsperada: f.fechaPagoEsperada,
      pagos: f.pagos,
    }));

    return {
      id: r.id,
      nombre: r.nombre,
      apellidos: r.apellidos,
      telefono: r.telefono,
      direccion: r.direccion,
      estadoCliente: r.estadoCliente,
      estadoCobranza: r.estadoCobranza,
      saldoPendiente: calcularSaldo(facturas).saldoPendiente,
      facturacionZona: r.facturacionZona,
      sector: r.sector,
      municipio: r.municipio,
      facturas: facturas.map((f) => ({
        id: f.id,
        montoFactura: f.monto,
        fechaPagoEsperada: f.fechaPagoEsperada,
      })),
    };
  }
}
