import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { calcularSaldo } from '../../domain/policies/saldo.policy';
import { ClienteFichaQueryPort } from '../../domain/ports/cliente-ficha-query.port';
import {
  ClienteDetalleReadModel,
  ClienteEdicionReadModel,
} from '../../domain/read-models/cliente-ficha.read-model';

const NOMBRADO = { select: { id: true, nombre: true } } as const;
const PERSONA = { select: { id: true, nombre: true, rol: true } } as const;

const IMAGEN = {
  id: true,
  cdnUrl: true,
  titulo: true,
  descripcion: true,
  categoria: true,
  estado: true,
  etiqueta: true,
} satisfies Prisma.MediaSelect;

const SELECT_TICKET = {
  id: true,
  titulo: true,
  descripcion: true,
  estado: true,
  prioridad: true,
  fechaApertura: true,
  fechaCierre: true,
  fechaInicioAtencion: true,
  fechaResolucionTecnico: true,
  creadoPor: NOMBRADO,
  tecnico: NOMBRADO,
  asignaciones: { select: { tecnico: NOMBRADO } },
  etiquetas: { select: { id: true, etiqueta: { select: { nombre: true } } } },
  resumen: {
    select: {
      id: true,
      tiempoTecnicoMinutos: true,
      tiempoTotalMinutos: true,
      resueltoComo: true,
      reabierto: true,
      numeroReaperturas: true,
      notasInternas: true,
      creadoEn: true,
    },
  },
  SeguimientoTicket: {
    select: {
      id: true,
      descripcion: true,
      creadoEn: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
          rol: true,
          perfil: {
            select: { avatarUrl: true, bio: true, portadaUrl: true },
          },
        },
      },
    },
  },
} satisfies Prisma.TicketSoporteSelect;

const SELECT_DETALLE = {
  id: true,
  nombre: true,
  apellidos: true,
  telefono: true,
  direccion: true,
  dpi: true,
  observaciones: true,
  contactoReferenciaNombre: true,
  contactoReferenciaTelefono: true,
  estadoCliente: true,
  estadoCobranza: true,
  estadoServicioMikrotik: true,
  contrasenaWifi: true,
  ssidRouter: true,
  fechaInstalacion: true,
  creadoEn: true,
  actualizadoEn: true,
  isEliminado: true,
  eliminadoEn: true,
  medias: {
    where: { categoria: { notIn: ['SOPORTE_TICKET'] } },
    select: IMAGEN,
  },
  asesor: NOMBRADO,
  municipio: NOMBRADO,
  departamento: NOMBRADO,
  sector: NOMBRADO,
  empresa: NOMBRADO,
  MikrotikRouter: NOMBRADO,
  IP: {
    select: { id: true, direccionIp: true, gateway: true, mascara: true },
  },
  ubicacion: { select: { id: true, latitud: true, longitud: true } },
  servicioInternet: {
    select: { id: true, nombre: true, velocidad: true, precio: true },
  },
  facturacionZona: {
    select: {
      id: true,
      nombre: true,
      creadoEn: true,
      actualizadoEn: true,
      enviarRecordatorio: true,
      diaPago: true,
      diaGeneracionFactura: true,
      diaCorte: true,
    },
  },
  ContratoServicioInternet: {
    select: {
      id: true,
      creadoEn: true,
      actualizadoEn: true,
      costoInstalacion: true,
      fechaInstalacionProgramada: true,
      fechaPago: true,
    },
  },
  ticketSoporte: { select: SELECT_TICKET },
  facturaInternet: {
    select: {
      id: true,
      montoPago: true,
      creadoEn: true,
      fechaPagoEsperada: true,
      fechaPagada: true,
      estadoFacturaInternet: true,
      periodo: true,
      creador: PERSONA,
      pagos: {
        select: {
          montoPagado: true,
          metodoPago: true,
          fechaPago: true,
          cobrador: PERSONA,
        },
      },
    },
  },
  clienteServicios: {
    select: {
      id: true,
      fechaInicio: true,
      servicio: {
        select: { id: true, nombre: true, precio: true, descripcion: true },
      },
    },
  },
} satisfies Prisma.ClienteInternetSelect;

type TicketRecord = Prisma.TicketSoporteGetPayload<{
  select: typeof SELECT_TICKET;
}>;

@Injectable()
export class ClienteFichaPrismaQuery implements ClienteFichaQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findDetalle(
    clienteId: number,
  ): Promise<ClienteDetalleReadModel | null> {
    const r = await this.prisma.clienteInternet.findUnique({
      where: { id: clienteId },
      select: SELECT_DETALLE,
    });
    if (!r) return null;

    const facturas = r.facturaInternet.map((f) => ({
      id: f.id,
      monto: Number(f.montoPago ?? 0),
      estado: f.estadoFacturaInternet,
      periodo: f.periodo,
      fechaEmision: f.creadoEn,
      fechaPagada: f.fechaPagada,
      fechaVencimiento: f.fechaPagoEsperada,
      creador: f.creador,
      pagos: f.pagos.map((p) => ({
        fechaPago: p.fechaPago,
        metodoPago: p.metodoPago,
        montoPagado: Number(p.montoPagado ?? 0),
        cobrador: p.cobrador,
      })),
    }));
    const contrato = r.ContratoServicioInternet;

    return {
      id: r.id,
      nombre: r.nombre,
      apellidos: r.apellidos,
      telefono: r.telefono,
      direccion: r.direccion,
      dpi: r.dpi,
      observaciones: r.observaciones,
      contactoReferenciaNombre: r.contactoReferenciaNombre,
      contactoReferenciaTelefono: r.contactoReferenciaTelefono,
      estadoCliente: r.estadoCliente,
      estadoCobranza: r.estadoCobranza,
      estadoServicioMikrotik: r.estadoServicioMikrotik,
      contrasenaWifi: r.contrasenaWifi,
      ssidRouter: r.ssidRouter,
      fechaInstalacion: r.fechaInstalacion,
      creadoEn: r.creadoEn,
      actualizadoEn: r.actualizadoEn,
      eliminadoEn: r.isEliminado ? r.eliminadoEn : null,
      imagenes: r.medias,
      asesor: r.asesor,
      servicio: r.servicioInternet,
      municipio: r.municipio,
      departamento: r.departamento,
      sector: r.sector,
      empresa: r.empresa,
      mikrotik: r.MikrotikRouter,
      ip: r.IP && {
        id: r.IP.id,
        direccion: r.IP.direccionIp,
        mascara: r.IP.mascara,
        gateway: r.IP.gateway,
      },
      ubicacion: r.ubicacion,
      facturacionZona: r.facturacionZona,
      contratoServicioInternet: contrato && {
        id: contrato.id,
        creadoEn: contrato.creadoEn,
        actualizadoEn: contrato.actualizadoEn,
        costoInstalacion:
          contrato.costoInstalacion === null
            ? null
            : Number(contrato.costoInstalacion),
        fechaInstalacionProgramada: contrato.fechaInstalacionProgramada,
        fechaPago: contrato.fechaPago,
      },
      saldo: calcularSaldo(facturas),
      tickets: r.ticketSoporte.map((t) => this.aTicket(t)),
      facturas,
      serviciosAdicionales: r.clienteServicios
        .filter((cs) => cs.servicio)
        .map((cs) => ({
          id: cs.id,
          servicio: {
            id: cs.servicio.id,
            nombre: cs.servicio.nombre,
            tipo: cs.servicio.descripcion,
            precio: Number(cs.servicio.precio),
          },
          fechaContratacion: cs.fechaInicio,
        })),
    };
  }

  async findEdicion(
    clienteId: number,
  ): Promise<ClienteEdicionReadModel | null> {
    const r = await this.prisma.clienteInternet.findUnique({
      where: { id: clienteId },
      include: {
        IP: true,
        ubicacion: true,
        municipio: NOMBRADO,
        departamento: NOMBRADO,
        sector: NOMBRADO,
        facturacionZona: NOMBRADO,
        MikrotikRouter: NOMBRADO,
        servicioInternet: {
          select: { id: true, nombre: true, velocidad: true },
        },
        clienteServicios: { select: { servicio: NOMBRADO } },
        medias: { select: IMAGEN },
        ContratoFisico: {
          select: {
            idContrato: true,
            fechaFirma: true,
            archivoContrato: true,
            observaciones: true,
          },
        },
      },
    });
    if (!r) return null;

    const { latitud, longitud } = r.ubicacion ?? {};

    return {
      id: r.id,
      eliminado: r.isEliminado,
      nombre: r.nombre,
      apellidos: r.apellidos,
      telefono: r.telefono,
      direccion: r.direccion,
      dpi: r.dpi,
      observaciones: r.observaciones,
      contactoReferenciaNombre: r.contactoReferenciaNombre,
      contactoReferenciaTelefono: r.contactoReferenciaTelefono,
      enviarRecordatorio: r.enviarRecordatorio,
      estadoCliente: r.estadoCliente,
      estadoCobranza: r.estadoCobranza,
      contrasenaWifi: r.contrasenaWifi,
      ssidRouter: r.ssidRouter,
      fechaInstalacion: r.fechaInstalacion,
      coordenadas:
        latitud != null && longitud != null ? { latitud, longitud } : null,
      ip: r.IP && {
        direccionIp: r.IP.direccionIp,
        gateway: r.IP.gateway,
        mascara: r.IP.mascara,
      },
      departamento: r.departamento,
      municipio: r.municipio,
      sector: r.sector,
      zonaFacturacion: r.facturacionZona,
      mikrotik: r.MikrotikRouter,
      servicioInternet: r.servicioInternet,
      servicios: r.clienteServicios.map((s) => s.servicio),
      imagenes: r.medias,
      contrato: r.ContratoFisico,
    };
  }

  private aTicket(t: TicketRecord): ClienteDetalleReadModel['tickets'][number] {
    return {
      id: t.id,
      titulo: t.titulo,
      descripcion: t.descripcion,
      estado: t.estado,
      prioridad: t.prioridad,
      fechaApertura: t.fechaApertura,
      fechaCierre: t.fechaCierre,
      fechaInicioAtencion: t.fechaInicioAtencion,
      fechaResolucionTecnico: t.fechaResolucionTecnico,
      resumen: t.resumen,
      etiquetas: t.etiquetas.map((e) => ({
        id: e.id,
        nombre: e.etiqueta.nombre,
      })),
      seguimientos: t.SeguimientoTicket.map((s) => ({
        id: s.id,
        descripcion: s.descripcion,
        creadoEn: s.creadoEn,
        usuario: s.usuario && {
          id: s.usuario.id,
          nombre: s.usuario.nombre,
          rol: s.usuario.rol,
          avatarUrl: s.usuario.perfil?.avatarUrl ?? null,
          portadaUrl: s.usuario.perfil?.portadaUrl ?? null,
          bio: s.usuario.perfil?.bio ?? null,
        },
      })),
      creadoPor: t.creadoPor,
      tecnico: t.tecnico,
      acompanantes: t.asignaciones.flatMap((a) =>
        a.tecnico ? [a.tecnico] : [],
      ),
    };
  }
}
