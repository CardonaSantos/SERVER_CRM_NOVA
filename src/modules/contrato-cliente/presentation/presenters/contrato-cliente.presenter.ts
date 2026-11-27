import { ContratoClienteEntity } from '../../domain/entities/contrato-cliente.entity';
import { DocumentoContratoReadModel } from '../../domain/read-models/documento-contrato.read-model';
import { ContratoClienteResponseDto } from '../dto/contrato-cliente-response.dto';
import { DocumentoContratoResponseDto } from '../dto/documento-contrato-response.dto';

export class ContratoClientePresenter {
  static contrato(contrato: ContratoClienteEntity): ContratoClienteResponseDto {
    const c = contrato.toPrimitives();

    return {
      id: c.id!,
      clienteId: c.clienteId,
      fechaInstalacionProgramada: c.fechaInstalacionProgramada,
      fechaPago: c.fechaPago,
      costoInstalacion: c.costoInstalacion,
      observaciones: c.observaciones,
      creadoEn: c.creadoEn.toISOString(),
    };
  }

  static documento(
    m: DocumentoContratoReadModel,
  ): DocumentoContratoResponseDto {
    return {
      empresa: {
        id: m.empresa.id,
        nombre: m.empresa.nombre,
        direccion: m.empresa.direccion,
        telefono: m.empresa.telefono,
        correo: m.empresa.correo,
        pbx: m.empresa.pbx,
        sitioWeb: m.empresa.sitioWeb,
      },
      instalacion: {
        id: m.instalacion.id,
        clienteId: m.instalacion.clienteId,
        servicioInternetId: m.instalacion.servicioInternetId,
        fechaProgramada: m.instalacion.fechaProgramada?.toISOString() ?? null,
        direccionInstalacion: m.instalacion.direccionInstalacion,
        referenciaUbicacion: m.instalacion.referenciaUbicacion,
        costoInstalacion: m.instalacion.costoInstalacion,
        costoMateriales: m.instalacion.costoMateriales,
        costoManoObra: m.instalacion.costoManoObra,
        costoOtros: m.instalacion.costoOtros,
        observaciones: m.instalacion.observaciones,
        notasCostos: m.instalacion.notasCostos,
        creadoEn: m.instalacion.creadoEn.toISOString(),
        actualizadoEn: m.instalacion.actualizadoEn.toISOString(),
      },
      cliente: {
        id: m.cliente.id,
        nombre: m.cliente.nombre,
        apellidos: m.cliente.apellidos,
        nombreCompleto: m.cliente.nombreCompleto,
        dpi: m.cliente.dpi,
        telefono: m.cliente.telefono,
        direccion: m.cliente.direccion,
        direccionServicio: m.cliente.direccionServicio,
        contactoReferenciaNombre: m.cliente.contactoReferenciaNombre,
        contactoReferenciaTelefono: m.cliente.contactoReferenciaTelefono,
      },
      servicio: m.servicio && {
        id: m.servicio.id,
        nombre: m.servicio.nombre,
        velocidad: m.servicio.velocidad,
        precio: m.servicio.precio,
      },
      facturacion: { diaPagoMensual: m.facturacion.diaPagoMensual },
      plantilla: { id: m.plantilla.id, nombre: m.plantilla.nombre },
      documento: {
        numero: m.documento.numero,
        fechaEmision: m.documento.fechaEmision.toISOString(),
        contenido: m.documento.contenido,
      },
    };
  }
}
