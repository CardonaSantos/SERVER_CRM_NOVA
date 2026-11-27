import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DocumentoContratoQueryPort } from '../../domain/ports/documento-contrato-query.port';
import { DatosDocumentoContrato } from '../../domain/read-models/documento-contrato.read-model';

@Injectable()
export class DocumentoContratoPrismaQuery
  implements DocumentoContratoQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findDatos(
    instalacionId: number,
  ): Promise<DatosDocumentoContrato | null> {
    const r = await this.prisma.clienteInstalacion.findFirst({
      where: { id: instalacionId, cliente: { isEliminado: false } },
      select: {
        id: true,
        clienteId: true,
        servicioInternetId: true,
        fechaProgramada: true,
        fechaActivacionServicio: true,
        direccionInstalacion: true,
        referenciaUbicacion: true,
        costoInstalacion: true,
        costoMateriales: true,
        costoManoObra: true,
        costoOtros: true,
        observaciones: true,
        notasCostos: true,
        creadoEn: true,
        actualizadoEn: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            telefono: true,
            correo: true,
            pbx: true,
            sitioWeb: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            dpi: true,
            telefono: true,
            direccion: true,
            contactoReferenciaNombre: true,
            contactoReferenciaTelefono: true,
            facturacionZona: { select: { diaPago: true } },
          },
        },
        servicioInternet: {
          select: { id: true, nombre: true, velocidad: true, precio: true },
        },
      },
    });

    if (!r) return null;

    const { empresa, cliente, servicioInternet, ...instalacion } = r;
    const { facturacionZona, ...datosCliente } = cliente;

    return {
      empresa,
      instalacion: {
        ...instalacion,
        costoInstalacion: Number(instalacion.costoInstalacion),
        costoMateriales: Number(instalacion.costoMateriales),
        costoManoObra: Number(instalacion.costoManoObra),
        costoOtros: Number(instalacion.costoOtros),
      },
      cliente: datosCliente,
      servicio: servicioInternet,
      diaPagoZona: facturacionZona?.diaPago ?? null,
    };
  }
}
