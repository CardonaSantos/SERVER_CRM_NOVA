import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateContratoClienteDto } from './dto/create-contrato-cliente.dto';
import { UpdateContratoClienteDto } from './dto/update-contrato-cliente.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePlantillaContratoDto } from './dto/update-plantilla-contrato';
import { CreatePlantillaContratoDto } from './dto/create-plantilla-contrato';
import { ContratoInstalacionVistaResponse } from './interfaces/ContratoInstalacionVistaResponse.type';

import { dayjs } from 'src/Utils/dayjs.config';

@Injectable()
export class ContratoClienteService {
  constructor(private readonly prisma: PrismaService) {}

  async crearContratoPorCliente(clienteId: number) {
    return this.prisma.contratoServicioInternet.create({
      data: {
        clienteId,
      },
    });
  }

  async crearContratoManual(dto: CreateContratoClienteDto) {
    console.log('Los datos del contrato son: ', dto);

    return this.prisma.contratoServicioInternet.create({
      data: {
        clienteId: dto.clienteId,
        fechaInstalacionProgramada: dto.fechaInstalacionProgramada
          ? new Date(dto.fechaInstalacionProgramada)
          : undefined,
        costoInstalacion: Number(dto.costoInstalacion),
        fechaPago: dto.fechaPago ? new Date(dto.fechaPago) : undefined,
        observaciones: dto.observaciones,
        // ssid: dto.ssid,
        // wifiPassword: dto.wifiPassword,
        // plantillaId: dto.plantillaId,
      },
    });
  }

  async getAllContratos() {
    try {
      const response = await this.prisma.contratoServicioInternet.findMany({
        include: {
          cliente: true,
        },
      });
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getVistaContratoPorInstalacion(
    instalacionId: number,
    plantillaId: number,
  ): Promise<ContratoInstalacionVistaResponse> {
    /**
     *  INSTALACIÓN
     */

    const instalacion = await this.prisma.clienteInstalacion.findUnique({
      where: {
        id: instalacionId,
      },

      select: {
        id: true,

        empresaId: true,
        clienteId: true,
        servicioInternetId: true,

        tipo: true,
        estado: true,

        fechaProgramada: true,
        fechaInicio: true,
        fechaFinalizacion: true,
        fechaCancelacion: true,
        fechaActivacionServicio: true,

        direccionInstalacion: true,
        referenciaUbicacion: true,
        latitud: true,
        longitud: true,

        costoInstalacion: true,
        costoMateriales: true,
        costoManoObra: true,
        costoOtros: true,

        montoCobradoCliente: true,

        notasCostos: true,

        observaciones: true,
        resultado: true,

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
          },
        },

        servicioInternet: {
          select: {
            id: true,
            nombre: true,
            precio: true,
            velocidad: true,
          },
        },
      },
    });

    if (!instalacion) {
      throw new NotFoundException(
        `Instalación ${instalacionId} no encontrada.`,
      );
    }

    /**
     *  PLANTILLA
     */

    const plantilla = await this.prisma.plantillaContrato.findUnique({
      where: {
        id: plantillaId,
      },

      select: {
        id: true,
        nombre: true,
        body: true,
        empresaId: true,
      },
    });

    if (!plantilla) {
      throw new NotFoundException(`Plantilla ${plantillaId} no encontrada.`);
    }

    if (plantilla.empresaId !== instalacion.empresaId) {
      throw new ConflictException(
        'La plantilla seleccionada no pertenece a la misma empresa que la instalación.',
      );
    }

    /**
     *  NORMALIZACIÓN
     */

    const nombreCompleto = [
      instalacion.cliente.nombre,
      instalacion.cliente.apellidos,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const direccionServicio =
      instalacion.direccionInstalacion ?? instalacion.cliente.direccion ?? null;

    const costoInstalacion = Number(instalacion.costoInstalacion);

    const costoMateriales = Number(instalacion.costoMateriales);

    const costoManoObra = Number(instalacion.costoManoObra);

    const costoOtros = Number(instalacion.costoOtros);

    const costoTotal =
      costoInstalacion + costoMateriales + costoManoObra + costoOtros;

    const fechaBasePago = instalacion.fechaActivacionServicio ?? new Date();

    const diaPagoMensual = this.getDayOfMonthGt(fechaBasePago);

    /**
     *  DATOS PARA VARIABLES DE PLANTILLA
     */

    const dataToTemplate: Record<string, string | number> = {
      instalacion_id: instalacion.id,

      nombre_cliente: nombreCompleto,

      dpi_cliente: instalacion.cliente.dpi ?? '',

      telefono_cliente: instalacion.cliente.telefono ?? '',

      direccion_cliente: instalacion.cliente.direccion ?? '',

      direccion_servicio: direccionServicio ?? '',

      referencia_ubicacion: instalacion.referenciaUbicacion ?? '',

      plan_nombre: instalacion.servicioInternet?.nombre ?? '',

      plan_velocidad: instalacion.servicioInternet?.velocidad ?? '',

      plan_precio: instalacion.servicioInternet
        ? Number(instalacion.servicioInternet.precio)
        : '',

      plan: instalacion.servicioInternet
        ? `${instalacion.servicioInternet.nombre}, precio: Q${Number(
            instalacion.servicioInternet.precio,
          ).toFixed(2)}`
        : '',

      fecha_instalacion_programada: this.formatDateGt(
        instalacion.fechaProgramada,
      ),

      fecha_activacion: this.formatDateGt(instalacion.fechaActivacionServicio),

      costo_instalacion: this.formatMoney(costoInstalacion),

      costo_materiales: this.formatMoney(costoMateriales),

      costo_mano_obra: this.formatMoney(costoManoObra),

      costo_otros: this.formatMoney(costoOtros),

      costo_total: this.formatMoney(costoTotal),

      dia_pago_mensual: diaPagoMensual,

      observaciones: instalacion.observaciones ?? '',

      referencia_nombre: instalacion.cliente.contactoReferenciaNombre ?? '',

      referencia_telefono: instalacion.cliente.contactoReferenciaTelefono ?? '',

      fecha_actual: this.formatDateGt(new Date()),
    };

    /**
     *  RENDER
     */

    const contenido = this.renderTemplate(plantilla.body, dataToTemplate);

    const fechaEmision = new Date();

    /**
     *  READ MODEL PARA UI
     */

    return {
      empresa: {
        id: instalacion.empresa.id,

        nombre: instalacion.empresa.nombre,

        direccion: instalacion.empresa.direccion,

        telefono: instalacion.empresa.telefono,

        correo: instalacion.empresa.correo,

        pbx: instalacion.empresa.pbx,

        sitioWeb: instalacion.empresa.sitioWeb,
      },

      instalacion: {
        id: instalacion.id,

        clienteId: instalacion.clienteId,

        servicioInternetId: instalacion.servicioInternetId,

        fechaProgramada: instalacion.fechaProgramada,

        direccionInstalacion: instalacion.direccionInstalacion,

        referenciaUbicacion: instalacion.referenciaUbicacion,

        costoInstalacion,
        costoMateriales,
        costoManoObra,
        costoOtros,

        observaciones: instalacion.observaciones,
        notasCostos: instalacion.notasCostos,

        creadoEn: instalacion.creadoEn,

        actualizadoEn: instalacion.actualizadoEn,
      },

      cliente: {
        id: instalacion.cliente.id,

        nombre: instalacion.cliente.nombre,

        apellidos: instalacion.cliente.apellidos,

        nombreCompleto,

        dpi: instalacion.cliente.dpi,

        telefono: instalacion.cliente.telefono,

        direccion: instalacion.cliente.direccion,

        direccionServicio,

        contactoReferenciaNombre: instalacion.cliente.contactoReferenciaNombre,

        contactoReferenciaTelefono:
          instalacion.cliente.contactoReferenciaTelefono,
      },

      servicio: instalacion.servicioInternet
        ? {
            id: instalacion.servicioInternet.id,

            nombre: instalacion.servicioInternet.nombre,

            velocidad: instalacion.servicioInternet.velocidad,

            precio: Number(instalacion.servicioInternet.precio),
          }
        : null,
      facturacion: {
        diaPagoMensual,
      },
      plantilla: {
        id: plantilla.id,

        nombre: plantilla.nombre,
      },

      documento: {
        numero: instalacion.id,

        fechaEmision,

        contenido,
      },
    };
  }

  private renderTemplate(
    template: string,
    data: Record<string, string | number>,
  ): string {
    return template.replace(/\[([^\]]+)\]/g, (_, key: string) => {
      const value = data[key.trim()];

      return value !== undefined ? String(value) : `[${key}]`;
    });
  }

  private formatDateGt(value: Date | null): string {
    if (!value) {
      return '';
    }

    return new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Guatemala',
    }).format(value);
  }

  private formatMoney(value: number): string {
    return `Q${value.toFixed(2)}`;
  }

  async editarContrato(dto: UpdateContratoClienteDto) {
    const existente = await this.prisma.contratoServicioInternet.findUnique({
      where: { id: dto.id },
    });
    if (!existente) throw new NotFoundException('Contrato no encontrado');

    return this.prisma.contratoServicioInternet.update({
      where: { id: dto.id },
      data: {
        clienteId: dto.clienteId,
        fechaInstalacionProgramada: dto.fechaInstalacionProgramada
          ? new Date(dto.fechaInstalacionProgramada)
          : undefined,
        costoInstalacion: dto.costoInstalacion,
        fechaPago: dto.fechaPago ? new Date(dto.fechaPago) : undefined,
        observaciones: dto.observaciones,
        // ssid: dto.ssid,
        // wifiPassword: dto.wifiPassword,
        // plantillaId: dto.plantillaId,
      },
    });
  }

  async eliminarContrato(id: number) {
    const contrato = await this.prisma.contratoServicioInternet.findUnique({
      where: { id },
    });

    if (!contrato) {
      throw new NotFoundException('El contrato no existe');
    }

    return this.prisma.contratoServicioInternet.delete({
      where: { id },
    });
  }

  //FUNCIONES PARA LAS PLANTILLAS DE CONTRATO
  async crearPlantilla(dto: CreatePlantillaContratoDto) {
    return this.prisma.plantillaContrato.create({
      data: {
        nombre: dto.nombre,
        body: dto.body,
        empresaId: dto.empresaId,
      },
    });
  }

  async getPlantillas() {
    try {
      const response = await this.prisma.plantillaContrato.findMany({});

      return response.map((plantilla) => ({
        id: plantilla.id,
        nombre: plantilla.nombre,
        body: plantilla.body,
        empresaId: plantilla.empresaId,
        creadoEn: plantilla.creadoEn,
        actualizadoEn: plantilla.actualizadoEn,
      }));
    } catch (error) {
      console.log(error);
    }
  }

  async editarPlantilla(dto: UpdatePlantillaContratoDto) {
    const existente = await this.prisma.plantillaContrato.findUnique({
      where: { id: dto.id },
    });
    if (!existente) throw new NotFoundException('Plantilla no encontrada');

    return this.prisma.plantillaContrato.update({
      where: { id: dto.id },
      data: {
        nombre: dto.nombre,
        body: dto.body,
        empresaId: dto.empresaId,
      },
    });
  }

  async eliminarPlantilla(id: number) {
    return this.prisma.plantillaContrato.delete({
      where: { id },
    });
  }

  private getDayOfMonthGt(date: Date): number {
    return dayjs(date).tz('America/Guatemala').date();
  }
}
