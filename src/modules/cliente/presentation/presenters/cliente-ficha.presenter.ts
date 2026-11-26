import {
  ClienteDetalleReadModel,
  ClienteEdicionReadModel,
  ImagenClienteReadModel,
  TicketClienteReadModel,
} from '../../domain/read-models/cliente-ficha.read-model';
import { nombrado } from './cliente-listado.presenter';

const fecha = (valor: Date | null): string | null =>
  valor ? valor.toISOString() : null;

/** La app Android valida esta forma: no se quitan ni se renombran campos. */
export class ClienteFichaPresenter {
  static detalle(c: ClienteDetalleReadModel) {
    const zona = c.facturacionZona;
    const contrato = c.contratoServicioInternet;

    return {
      id: c.id,
      nombre: c.nombre,
      // La app exige texto.
      apellidos: c.apellidos ?? '',
      telefono: c.telefono,
      direccion: c.direccion,
      dpi: c.dpi,
      observaciones: c.observaciones,
      contactoReferenciaNombre: c.contactoReferenciaNombre,
      contactoReferenciaTelefono: c.contactoReferenciaTelefono,
      estadoCliente: c.estadoCliente,
      estadoCobranza: c.estadoCobranza,
      estadoServicioMikrotik: c.estadoServicioMikrotik,
      servicioEstado: c.estadoServicioMikrotik === 'ACTIVO',
      contrasenaWifi: c.contrasenaWifi,
      ssidRouter: c.ssidRouter,
      fechaInstalacion: fecha(c.fechaInstalacion),
      creadoEn: c.creadoEn.toISOString(),
      actualizadoEn: c.actualizadoEn.toISOString(),
      eliminadoEn: fecha(c.eliminadoEn),
      imagenes: c.imagenes.map((i) => ClienteFichaPresenter.imagen(i, c.id)),
      asesor: nombrado(c.asesor),
      servicio: c.servicio && {
        id: c.servicio.id,
        nombre: c.servicio.nombre,
        precio: c.servicio.precio,
        velocidad: c.servicio.velocidad,
      },
      municipio: nombrado(c.municipio),
      departamento: nombrado(c.departamento),
      sector: nombrado(c.sector),
      empresa: nombrado(c.empresa),
      mikrotik: nombrado(c.mikrotik),
      IP: c.ip && {
        id: c.ip.id,
        direccion: c.ip.direccion,
        mascara: c.ip.mascara,
        gateway: c.ip.gateway,
      },
      ubicacion: c.ubicacion && {
        id: c.ubicacion.id,
        latitud: c.ubicacion.latitud,
        longitud: c.ubicacion.longitud,
      },
      facturacionZona: zona && {
        id: zona.id,
        nombre: zona.nombre,
        creadoEn: zona.creadoEn.toISOString(),
        actualizadoEn: zona.actualizadoEn.toISOString(),
        enviarRecordatorio: zona.enviarRecordatorio,
        diaPago: zona.diaPago,
        diaGeneracionFactura: zona.diaGeneracionFactura,
        diaCorte: zona.diaCorte,
      },
      contratoServicioInternet: contrato && {
        id: contrato.id,
        creadoEn: contrato.creadoEn.toISOString(),
        actualizadoEn: contrato.actualizadoEn.toISOString(),
        costoInstalacion: contrato.costoInstalacion,
        fechaInstalacionProgramada: fecha(contrato.fechaInstalacionProgramada),
        fechaPago: fecha(contrato.fechaPago),
      },
      saldoCliente: {
        id: c.id,
        saldo: c.saldo.totalPagado,
        saldoPendiente: c.saldo.saldoPendiente,
        totalPagos: c.saldo.totalPagado,
        ultimoPago: fecha(c.saldo.ultimoPago),
      },
      ticketSoporte: c.tickets.map((t) => ClienteFichaPresenter.ticket(t)),
      facturaInternet: c.facturas.map((f) => ({
        id: f.id,
        monto: f.monto,
        fechaEmision: f.fechaEmision.toISOString(),
        fechaPagada: fecha(f.fechaPagada),
        fechaVencimiento: fecha(f.fechaVencimiento),
        pagada: f.estado === 'PAGADA',
        estado: f.estado,
        periodo: f.periodo,
        creador: f.creador && {
          id: f.creador.id,
          nombre: f.creador.nombre,
          rol: f.creador.rol,
        },
        pagos: f.pagos.map((p) => ({
          fechaPago: p.fechaPago.toISOString(),
          metodoPago: p.metodoPago,
          montoPagado: p.montoPagado,
          cobrador: p.cobrador && {
            id: p.cobrador.id,
            nombreCobrador: p.cobrador.nombre,
            rol: p.cobrador.rol,
          },
        })),
      })),
      clienteServicio: c.serviciosAdicionales.map((s) => ({
        id: s.id,
        servicio: {
          id: s.servicio.id,
          nombre: s.servicio.nombre,
          tipo: s.servicio.tipo,
          precio: s.servicio.precio,
        },
        fechaContratacion: fecha(s.fechaContratacion),
      })),
    };
  }

  static edicion(c: ClienteEdicionReadModel) {
    const plan = c.servicioInternet;

    return {
      id: c.id,
      nombre: c.nombre,
      apellidos: c.apellidos,
      telefono: c.telefono,
      direccion: c.direccion,
      dpi: c.dpi,
      enviarRecordatorio: c.enviarRecordatorio,
      observaciones: c.observaciones,
      contactoReferenciaNombre: c.contactoReferenciaNombre,
      contactoReferenciaTelefono: c.contactoReferenciaTelefono,
      estado: c.estadoCliente,
      estadoCobranza: c.estadoCobranza,
      coordenadas: c.coordenadas
        ? [`${c.coordenadas.latitud}`, `${c.coordenadas.longitud}`]
        : [],
      ip: c.ip?.direccionIp ?? '',
      gateway: c.ip?.gateway ?? '',
      mascara: c.ip?.mascara ?? '',
      contrasenaWifi: c.contrasenaWifi,
      ssidRouter: c.ssidRouter,
      fechaInstalacion: fecha(c.fechaInstalacion),
      departamento: nombrado(c.departamento),
      municipio: nombrado(c.municipio),
      imagenes: c.imagenes.map((i) => ClienteFichaPresenter.imagen(i, c.id)),
      servicios: c.servicios.map((s) => ({ id: s.id, nombre: s.nombre })),
      zonaFacturacion: nombrado(c.zonaFacturacion),
      sector: nombrado(c.sector),
      servicioWifi: plan && {
        id: plan.id,
        nombre: plan.nombre,
        velocidad: plan.velocidad,
      },
      contrato: c.contrato && {
        idContrato: c.contrato.idContrato,
        fechaFirma: fecha(c.contrato.fechaFirma),
        archivoContrato: c.contrato.archivoContrato,
        observaciones: c.contrato.observaciones,
      },
      mikrotik: nombrado(c.mikrotik),
    };
  }

  private static imagen(i: ImagenClienteReadModel, customerId: number) {
    return {
      id: i.id,
      categoria: i.categoria ?? 'CLIENTE_GENERAL',
      cdnUrl: i.cdnUrl ?? '',
      descripcion: i.descripcion ?? '',
      estado: i.estado ?? 'LISTO',
      etiqueta: i.etiqueta ?? '',
      titulo: i.titulo ?? '',
      customerId,
    };
  }

  private static ticket(t: TicketClienteReadModel) {
    const resumen = t.resumen;

    return {
      id: t.id,
      titulo: t.titulo,
      descripcion: t.descripcion,
      estado: t.estado,
      prioridad: t.prioridad,
      fechaApertura: t.fechaApertura.toISOString(),
      fechaCierre: fecha(t.fechaCierre),
      fechaInicioAtencion: fecha(t.fechaInicioAtencion),
      fechaResolucionTecnico: fecha(t.fechaResolucionTecnico),
      resumen: resumen && {
        id: resumen.id,
        tiempoTecnicoMinutos: resumen.tiempoTecnicoMinutos,
        tiempoTotalMinutos: resumen.tiempoTotalMinutos,
        resueltoComo: resumen.resueltoComo,
        reabierto: resumen.reabierto,
        numeroReaperturas: resumen.numeroReaperturas,
        notasInternas: resumen.notasInternas,
        creadoEn: resumen.creadoEn.toISOString(),
      },
      etiquetas: t.etiquetas.map((e) => ({ id: e.id, nombre: e.nombre })),
      seguimientos: t.seguimientos.map((s) => ({
        id: s.id,
        descripcion: s.descripcion,
        creadoEn: s.creadoEn.toISOString(),
        usuario: {
          id: s.usuario?.id ?? -1,
          nombre: s.usuario?.nombre ?? 'Usuario eliminado',
          rol: s.usuario?.rol ?? null,
          perfil: {
            avatar: s.usuario?.avatarUrl ?? null,
            portadaUrl: s.usuario?.portadaUrl ?? null,
            bio: s.usuario?.bio ?? null,
          },
        },
      })),
      // Nombre histórico del campo.
      creadoPro: nombrado(t.creadoPor),
      tecnico: nombrado(t.tecnico),
      acompanantes: t.acompanantes.map((a) => ({
        id: a.id,
        nombre: a.nombre,
      })),
    };
  }
}
