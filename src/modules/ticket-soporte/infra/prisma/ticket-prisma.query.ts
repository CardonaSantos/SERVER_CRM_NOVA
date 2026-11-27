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
import { dayjs } from 'src/Utils/dayjs.config';
import { BandejaTicket } from '../../domain/enums/bandeja-ticket.enum';
import { EstadoTicket } from '../../domain/enums/estado-ticket.enum';
import {
  CampoFechaTicket,
  OrdenTicket,
} from '../../domain/enums/orden-ticket.enum';
import { PrioridadTicket } from '../../domain/enums/prioridad-ticket.enum';
import { interpretarBusqueda } from '../../domain/policies/busqueda-ticket.policy';
import { estadosDeBandeja } from '../../domain/policies/fase-ticket.policy';
import { TicketQueryPort } from '../../domain/ports/ticket-query.port';
import { OpcionesTicket } from '../../domain/read-models/catalogo-ticket.read-model';
import { ActividadTicket } from '../../domain/read-models/ticket-actividad.read-model';
import {
  FirmaBoleta,
  TicketBoletaReadModel,
} from '../../domain/read-models/ticket-boleta.read-model';
import { TicketDetalleReadModel } from '../../domain/read-models/ticket-detalle.read-model';
import {
  TicketFiltros,
  TicketListItem,
} from '../../domain/read-models/ticket-listado.read-model';

type Where = Prisma.TicketSoporteWhereInput;
type Orden = Prisma.TicketSoporteOrderByWithRelationInput;

const ZONA = 'America/Guatemala';

const PERSONA = { select: { id: true, nombre: true } } as const;

const SELECCION_CLIENTE = {
  id: true,
  nombre: true,
  apellidos: true,
  telefono: true,
  direccion: true,
  sector: { select: { id: true, nombre: true } },
  ubicacion: { select: { latitud: true, longitud: true } },
} satisfies Prisma.ClienteInternetSelect;

const SELECCION_LISTA = {
  id: true,
  titulo: true,
  descripcion: true,
  estado: true,
  prioridad: true,
  fijado: true,
  fechaApertura: true,
  fechaCierre: true,
  actualizadoEn: true,
  cliente: { select: SELECCION_CLIENTE },
  tecnico: PERSONA,
  creadoPor: PERSONA,
  asignaciones: { select: { tecnico: PERSONA }, orderBy: { id: 'asc' } },
  etiquetas: { select: { etiqueta: PERSONA }, orderBy: { id: 'asc' } },
  // Solo para contar comentarios e imágenes vigentes.
  SeguimientoTicket: {
    where: { eliminadoEn: null },
    select: {
      _count: { select: { medios: { where: { eliminadoEn: null } } } },
    },
  },
} satisfies Prisma.TicketSoporteSelect;

const SELECCION_DETALLE = {
  ...SELECCION_LISTA,
  fechaAsignacion: true,
  fechaInicioAtencion: true,
  fechaResolucionTecnico: true,
  canceladoEn: true,
  canceladoPorId: true,
  motivoCancelacion: true,
  cliente: {
    select: {
      ...SELECCION_CLIENTE,
      contactoReferenciaTelefono: true,
      observaciones: true,
      municipio: { select: { nombre: true } },
      departamento: { select: { nombre: true } },
      medias: {
        where: {
          categoria: { not: 'SOPORTE_TICKET' },
          eliminadoEn: null,
          cdnUrl: { not: null },
        },
        select: {
          id: true,
          cdnUrl: true,
          titulo: true,
          descripcion: true,
          creadoEn: true,
        },
        orderBy: { id: 'asc' },
      },
    },
  },
  resumen: {
    select: {
      solucion: { select: { id: true, solucion: true } },
      resueltoComo: true,
      notasInternas: true,
      tiempoTotalMinutos: true,
      tiempoTecnicoMinutos: true,
      numeroReaperturas: true,
    },
  },
  logsTiempo: {
    select: { id: true, inicio: true, fin: true, duracionMinutos: true },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.TicketSoporteSelect;

const AUTOR = {
  select: {
    id: true,
    nombre: true,
    perfil: { select: { avatarUrl: true } },
  },
} as const;

type RegistroLista = Prisma.TicketSoporteGetPayload<{
  select: typeof SELECCION_LISTA;
}>;

function nombreCompleto(cliente: {
  nombre: string | null;
  apellidos: string | null;
}): string {
  return (
    `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
    'Cliente sin nombre'
  );
}

function aCliente(cliente: NonNullable<RegistroLista['cliente']>) {
  const { latitud, longitud } = cliente.ubicacion ?? {};

  return {
    id: cliente.id,
    nombre: nombreCompleto(cliente),
    telefono: cliente.telefono,
    direccion: cliente.direccion,
    sector: cliente.sector,
    ubicacion:
      latitud != null && longitud != null ? { latitud, longitud } : null,
  };
}

function aListItem(record: RegistroLista): TicketListItem {
  return {
    id: record.id,
    titulo: record.titulo,
    descripcion: record.descripcion,
    estado: record.estado as EstadoTicket,
    prioridad: record.prioridad as PrioridadTicket,
    fijado: record.fijado,
    cliente: record.cliente ? aCliente(record.cliente) : null,
    tecnico: record.tecnico,
    apoyos: record.asignaciones
      .map((asignacion) => asignacion.tecnico)
      .filter((tecnico) => tecnico.id !== record.tecnico?.id),
    etiquetas: record.etiquetas.map((relacion) => relacion.etiqueta),
    creadoPor: record.creadoPor,
    fechaApertura: record.fechaApertura,
    fechaCierre: record.fechaCierre,
    ultimaActividadEn: record.actualizadoEn,
    totalComentarios: record.SeguimientoTicket.length,
    totalImagenes: record.SeguimientoTicket.reduce(
      (total, comentario) => total + comentario._count.medios,
      0,
    ),
  };
}

/** Principal o apoyo. */
function asignadoA(ids: number[]): Where[] {
  return [
    { tecnicoId: { in: ids } },
    { asignaciones: { some: { tecnicoId: { in: ids } } } },
  ];
}

/** Días completos de Guatemala; cualquiera de los dos extremos puede faltar. */
function rangoDeFechas(desde?: string, hasta?: string): Prisma.DateTimeFilter {
  const dia = (fecha: string) => dayjs.tz(fecha, ZONA).startOf('day');

  return {
    ...(desde && { gte: dia(desde).toDate() }),
    ...(hasta && { lt: dia(hasta).add(1, 'day').toDate() }),
  };
}

function busqueda(texto: string | undefined): Where | null {
  const criterio = interpretarBusqueda(texto);
  if (!criterio) return null;

  const contiene = (valor: string) => ({
    contains: valor,
    mode: 'insensitive' as const,
  });
  const opciones: Where[] = [{ titulo: contiene(criterio.texto) }];

  if (criterio.id !== null) opciones.push({ id: criterio.id });

  if (criterio.telefono) {
    opciones.push(
      { cliente: { telefono: contiene(criterio.telefono) } },
      { cliente: { contactoReferenciaTelefono: contiene(criterio.telefono) } },
    );
  }

  if (criterio.palabras.length) {
    opciones.push(
      { descripcion: contiene(criterio.texto) },
      {
        cliente: {
          AND: criterio.palabras.map((palabra) => ({
            OR: [
              { nombre: contiene(palabra) },
              { apellidos: contiene(palabra) },
            ],
          })),
        },
      },
    );
  }

  return { OR: opciones };
}

/** Filtros de la lista, sin la bandeja. */
function construirWhere(filtros: TicketFiltros): Where {
  const condiciones: Where[] = [];

  if (filtros.soloAsignadosA !== undefined) {
    condiciones.push({ OR: asignadoA([filtros.soloAsignadosA]) });
  }
  if (filtros.asignadoA !== undefined) {
    condiciones.push({ OR: asignadoA([filtros.asignadoA]) });
  }
  if (filtros.creadoPorId !== undefined) {
    condiciones.push({ creadoPorId: filtros.creadoPorId });
  }

  const porTecnico: Where[] = [
    ...(filtros.tecnicoIds?.length ? asignadoA(filtros.tecnicoIds) : []),
    ...(filtros.sinTecnico
      ? [{ tecnicoId: null, asignaciones: { none: {} } }]
      : []),
  ];
  if (porTecnico.length) condiciones.push({ OR: porTecnico });

  if (filtros.sectorIds?.length) {
    condiciones.push({ cliente: { sectorId: { in: filtros.sectorIds } } });
  }
  if (filtros.etiquetaIds?.length) {
    condiciones.push({
      etiquetas: { some: { etiquetaId: { in: filtros.etiquetaIds } } },
    });
  }
  if (filtros.prioridades?.length) {
    condiciones.push({ prioridad: { in: filtros.prioridades } });
  }
  if (filtros.clienteId !== undefined) {
    condiciones.push({ clienteId: filtros.clienteId });
  }
  if (filtros.desde || filtros.hasta) {
    const rango = rangoDeFechas(filtros.desde, filtros.hasta);

    condiciones.push(
      filtros.fechaDe === CampoFechaTicket.RESOLUCION
        ? { fechaCierre: rango }
        : { fechaApertura: rango },
    );
  }

  const textoBuscado = busqueda(filtros.search);
  if (textoBuscado) condiciones.push(textoBuscado);

  return { AND: condiciones };
}

/** Con búsqueda se mira en todos los estados. */
function bandejaEfectiva(filtros: TicketFiltros): BandejaTicket {
  if (filtros.search?.trim()) return BandejaTicket.TODOS;

  return filtros.bandeja ?? BandejaTicket.ACTIVOS;
}

const ORDEN: Record<OrdenTicket, (dir: DireccionOrden) => Orden> = {
  [OrdenTicket.APERTURA]: (dir) => ({ fechaApertura: dir }),
  [OrdenTicket.RESOLUCION]: (dir) => ({
    fechaCierre: { sort: dir, nulls: 'last' },
  }),
  [OrdenTicket.PRIORIDAD]: (dir) => ({ prioridad: dir }),
  [OrdenTicket.ACTIVIDAD]: (dir) => ({ actualizadoEn: dir }),
};

/** Fijados arriba; los activos, del más antiguo al más nuevo. */
function construirOrden(filtros: TicketFiltros): Orden[] {
  const fijados: Orden = { fijado: 'desc' };

  if (filtros.sortBy) {
    const dir =
      filtros.sortDir ??
      (filtros.sortBy === OrdenTicket.APERTURA ? 'asc' : 'desc');

    return [fijados, ORDEN[filtros.sortBy](dir), { id: dir }];
  }

  const bandeja = bandejaEfectiva(filtros);

  if (bandeja === BandejaTicket.RESUELTOS) {
    const dir = filtros.sortDir ?? 'desc';

    return [fijados, ORDEN[OrdenTicket.RESOLUCION](dir), { id: dir }];
  }
  if (bandeja === BandejaTicket.CANCELADOS) {
    const dir = filtros.sortDir ?? 'desc';

    return [
      fijados,
      { canceladoEn: { sort: dir, nulls: 'last' } },
      { actualizadoEn: dir },
      { id: dir },
    ];
  }

  const dir =
    filtros.sortDir ?? (bandeja === BandejaTicket.TODOS ? 'desc' : 'asc');

  return [fijados, { fechaApertura: dir }, { id: dir }];
}

@Injectable()
export class TicketPrismaQuery implements TicketQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filtros: TicketFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<TicketListItem>> {
    const where: Where = {
      AND: [
        construirWhere(filtros),
        { estado: { in: estadosDeBandeja(bandejaEfectiva(filtros)) } },
      ],
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.ticketSoporte.findMany({
        where,
        select: SELECCION_LISTA,
        orderBy: construirOrden(filtros),
        ...aDesplazamiento(paginacion),
      }),
      this.prisma.ticketSoporte.count({ where }),
    ]);

    return crearResultadoPaginado(records.map(aListItem), total, paginacion);
  }

  async contarPorEstado(
    filtros: TicketFiltros,
  ): Promise<Array<{ estado: EstadoTicket; total: number }>> {
    const grupos = await this.prisma.ticketSoporte.groupBy({
      by: ['estado'],
      where: construirWhere(filtros),
      _count: { _all: true },
    });

    return grupos.map((grupo) => ({
      estado: grupo.estado as EstadoTicket,
      total: grupo._count._all,
    }));
  }

  async findDetail(ticketId: number): Promise<TicketDetalleReadModel | null> {
    const record = await this.prisma.ticketSoporte.findUnique({
      where: { id: ticketId },
      select: SELECCION_DETALLE,
    });
    if (!record) return null;

    const canceladoPor = record.canceladoPorId
      ? await this.prisma.usuario.findUnique({
          where: { id: record.canceladoPorId },
          ...PERSONA,
        })
      : null;
    const base = aListItem(record);
    const cliente = record.cliente;
    const resumen = record.resumen;

    return {
      ...base,
      descripcion: record.descripcion,
      cliente: cliente
        ? {
            ...aCliente(cliente),
            telefonoReferencia: cliente.contactoReferenciaTelefono,
            municipio: cliente.municipio?.nombre ?? null,
            departamento: cliente.departamento?.nombre ?? null,
            observaciones: cliente.observaciones,
            archivos: cliente.medias.map((media) => ({
              id: media.id,
              url: media.cdnUrl!,
              titulo: media.titulo,
              descripcion: media.descripcion,
              creadoEn: media.creadoEn,
            })),
          }
        : null,
      fechaAsignacion: record.fechaAsignacion,
      fechaInicioAtencion: record.fechaInicioAtencion,
      fechaResolucionTecnico: record.fechaResolucionTecnico,
      cancelacion: record.canceladoEn
        ? {
            fecha: record.canceladoEn,
            motivo: record.motivoCancelacion,
            por: canceladoPor,
          }
        : null,
      resumen: resumen
        ? {
            ...resumen,
            solucion: resumen.solucion
              ? {
                  id: resumen.solucion.id,
                  nombre: resumen.solucion.solucion,
                }
              : null,
          }
        : null,
      ciclos: record.logsTiempo,
    };
  }

  async findActividad(
    ticketId: number,
    paginacion: Paginacion,
    sortDir: DireccionOrden,
  ): Promise<ResultadoPaginado<ActividadTicket>> {
    // Un ticket tiene pocas entradas: se mezclan en memoria y se pagina.
    const [eventos, comentarios] = await this.prisma.$transaction([
      this.prisma.ticketSoporteHistorial.findMany({
        where: { ticketId },
        select: {
          id: true,
          tipo: true,
          descripcion: true,
          creadoEn: true,
          usuarioId: true,
          usuarioNombre: true,
          usuario: AUTOR,
        },
      }),
      this.prisma.seguimientoTicket.findMany({
        where: { ticketId },
        select: {
          id: true,
          descripcion: true,
          fechaRegistro: true,
          editadoEn: true,
          eliminadoEn: true,
          eliminadoPorId: true,
          usuario: AUTOR,
          medios: {
            where: { eliminadoEn: null },
            select: { media: { select: { id: true, cdnUrl: true } } },
            orderBy: { orden: 'asc' },
          },
        },
      }),
    ]);

    const borradores = await this.nombresDe(
      comentarios.flatMap((c) => c.eliminadoPorId ?? []),
    );

    const items: ActividadTicket[] = [
      ...eventos.map((evento) => ({
        tipo: 'EVENTO' as const,
        id: evento.id,
        fecha: evento.creadoEn,
        autor: {
          id: evento.usuarioId,
          nombre: evento.usuarioNombre ?? evento.usuario?.nombre ?? 'Sistema',
          avatarUrl: evento.usuario?.perfil?.avatarUrl ?? null,
        },
        evento: evento.tipo,
        texto: evento.descripcion,
      })),
      ...comentarios.map((comentario) => {
        const eliminado = comentario.eliminadoEn
          ? {
              fecha: comentario.eliminadoEn,
              por: borradores.get(comentario.eliminadoPorId ?? 0) ?? null,
            }
          : null;

        return {
          tipo: 'COMENTARIO' as const,
          id: comentario.id,
          fecha: comentario.fechaRegistro,
          autor: {
            id: comentario.usuario.id,
            nombre: comentario.usuario.nombre,
            avatarUrl: comentario.usuario.perfil?.avatarUrl ?? null,
          },
          // Lo eliminado no sale de la base.
          texto: eliminado ? '' : comentario.descripcion,
          editadoEn: comentario.editadoEn,
          imagenes: eliminado
            ? []
            : comentario.medios.flatMap(({ media }) =>
                media.cdnUrl ? [{ id: media.id, url: media.cdnUrl }] : [],
              ),
          eliminado,
        };
      }),
    ];

    const signo = sortDir === 'asc' ? 1 : -1;
    items.sort(
      (a, b) =>
        signo *
        (a.fecha.getTime() - b.fecha.getTime() ||
          a.tipo.localeCompare(b.tipo) * -1 ||
          a.id - b.id),
    );

    const { skip, take } = aDesplazamiento(paginacion);

    return crearResultadoPaginado(
      items.slice(skip, skip + take),
      items.length,
      paginacion,
    );
  }

  async findBoleta(
    ticketId: number,
    empresaPorDefectoId: number,
  ): Promise<TicketBoletaReadModel | null> {
    const ticket = await this.prisma.ticketSoporte.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        estado: true,
        prioridad: true,
        fechaApertura: true,
        fechaCierre: true,
        empresaId: true,
        tecnico: PERSONA,
        asignaciones: { select: { tecnicoId: true } },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            direccion: true,
          },
        },
        // El ciclo de conformidad más reciente.
        ticketsConformidad: {
          orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
          take: 1,
          select: {
            id: true,
            resultado: true,
            creadoEn: true,
            respondidoEn: true,
            firmas: {
              select: {
                id: true,
                tipo: true,
                nombreFirmante: true,
                telefonoFirmante: true,
                usuarioFirmanteId: true,
                firmadoEn: true,
                media: { select: { cdnUrl: true, mimeType: true } },
              },
            },
          },
        },
      },
    });
    if (!ticket) return null;

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: ticket.empresaId ?? empresaPorDefectoId },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        correo: true,
        telefono: true,
        pbx: true,
      },
    });
    const [conformidad] = ticket.ticketsConformidad;
    const firma = (tipo: string): FirmaBoleta | null => {
      const registro = conformidad?.firmas.find((f) => f.tipo === tipo);
      if (!registro) return null;

      return {
        id: registro.id,
        nombreFirmante: registro.nombreFirmante,
        telefonoFirmante: registro.telefonoFirmante,
        usuarioFirmanteId: registro.usuarioFirmanteId,
        firmadoEn: registro.firmadoEn,
        url: registro.media.cdnUrl,
        mimeType: registro.media.mimeType,
      };
    };

    return {
      ticketId: ticket.id,
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
      estado: ticket.estado as EstadoTicket,
      prioridad: ticket.prioridad as PrioridadTicket,
      fechaApertura: ticket.fechaApertura,
      fechaCierre: ticket.fechaCierre,
      asignados: [
        ...(ticket.tecnico ? [ticket.tecnico.id] : []),
        ...ticket.asignaciones.map((asignacion) => asignacion.tecnicoId),
      ],
      cliente: ticket.cliente
        ? {
            id: ticket.cliente.id,
            nombre: nombreCompleto(ticket.cliente),
            telefono: ticket.cliente.telefono,
            direccion: ticket.cliente.direccion,
          }
        : null,
      tecnico: ticket.tecnico,
      empresa,
      conformidad: conformidad
        ? {
            id: conformidad.id,
            resultado: conformidad.resultado,
            creadoEn: conformidad.creadoEn,
            respondidoEn: conformidad.respondidoEn,
          }
        : null,
      firmaCliente: firma('CLIENTE'),
      firmaTecnico: firma('TECNICO'),
    };
  }

  async findOpciones(): Promise<OpcionesTicket> {
    const [usuarios, sectores, etiquetas, soluciones] =
      await this.prisma.$transaction([
        this.prisma.usuario.findMany({
          where: { activo: true },
          select: { id: true, nombre: true, rol: true },
          orderBy: { nombre: 'asc' },
        }),
        this.prisma.sector.findMany({
          where: { eliminadoEn: null },
          select: {
            id: true,
            nombre: true,
            municipio: { select: { nombre: true } },
          },
          orderBy: { nombre: 'asc' },
        }),
        this.prisma.etiquetaTicket.findMany({
          where: { eliminadoEn: null },
          ...PERSONA,
          orderBy: { nombre: 'asc' },
        }),
        this.prisma.solucionTicket.findMany({
          where: { isEliminado: false },
          select: { id: true, solucion: true, descripcion: true },
          orderBy: { solucion: 'asc' },
        }),
      ]);

    return {
      tecnicos: usuarios,
      sectores: sectores.map((sector) => ({
        id: sector.id,
        nombre: sector.nombre,
        municipio: sector.municipio.nombre,
      })),
      etiquetas,
      soluciones: soluciones.map((solucion) => ({
        id: solucion.id,
        nombre: solucion.solucion,
        descripcion: solucion.descripcion,
      })),
    };
  }

  private async nombresDe(ids: number[]): Promise<Map<number, string>> {
    if (!ids.length) return new Map();

    const usuarios = await this.prisma.usuario.findMany({
      where: { id: { in: ids } },
      ...PERSONA,
    });

    return new Map(usuarios.map((usuario) => [usuario.id, usuario.nombre]));
  }
}
