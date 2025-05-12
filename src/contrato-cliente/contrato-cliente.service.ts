import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateContratoClienteDto } from './dto/create-contrato-cliente.dto';
import { UpdateContratoClienteDto } from './dto/update-contrato-cliente.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePlantillaContratoDto } from './dto/update-plantilla-contrato';
import { CreatePlantillaContratoDto } from './dto/create-plantilla-contrato';

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

  async getOneContrato(contratoId: number, plantillaId: number) {
    try {
      // 1. Obtener el contrato (sin plantilla incluida porque ya no tiene relación)
      const contratox = await this.prisma.contratoServicioInternet.findUnique({
        where: { id: contratoId },
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              // correo: true,
              direccion: true,
              servicioInternet: {
                select: {
                  id: true,
                  nombre: true,
                  precio: true,
                  velocidad: true,
                },
              },
            },
          },
        },
      });

      const empresa = await this.prisma.empresa.findFirst({
        select: {
          id: true,
          nombre: true,
          direccion: true,
          telefono: true,
          correo: true,
          pbx: true,
          sitioWeb: true,
        },
      });

      if (!empresa) {
        throw new NotFoundException('Empresa no encontrado');
      }

      if (!contratox) {
        throw new NotFoundException('Contrato no encontrado');
      }

      // 2. Obtener la plantilla por separado
      const plantilla = await this.prisma.plantillaContrato.findUnique({
        where: { id: plantillaId },
      });

      if (!plantilla) {
        throw new NotFoundException('Plantilla no encontrada');
      }

      const contrato = {
        id: contratox.id,
        clienteId: contratox.cliente.id,
        fechaInstalacionProgramada: contratox.fechaInstalacionProgramada,
        costoInstalacion: contratox.costoInstalacion,
        fechaPago: contratox.fechaPago,
        observaciones: contratox.observaciones,
        // ssid: contratox.ssid,
        // wifiPassword: contratox.wifiPassword,
        creadoEn: contratox.creadoEn,
        actualizadoEn: contratox.actualizadoEn,
        cliente: {
          id: contratox.cliente.id,
          nombre: contratox.cliente.nombre,
          apellidos: contratox.cliente.apellidos,
          telefono: contratox.cliente.telefono,
          direccion: contratox.cliente.direccion,
          plan: `${contratox.cliente.servicioInternet.nombre}, precio: Q${contratox.cliente.servicioInternet.precio}`,
        },
      };

      // 3. Preparar datos para la plantilla
      const dataToTemplate = {
        nombre_cliente: `${contratox.cliente.nombre} ${contratox.cliente.apellidos ?? ''}`,
        plan: `${contratox.cliente.servicioInternet.nombre}, precio: Q${contratox.cliente.servicioInternet.precio}, `,
        fecha_instalacion_programada:
          contratox.fechaInstalacionProgramada?.toLocaleDateString('es-GT') ??
          '',
        fecha_pago: contratox.fechaPago?.toLocaleDateString('es-GT') ?? '',
        costo_instalacion: contratox.costoInstalacion ?? '',
        fecha_actual: new Date().toLocaleDateString('es-GT'),
      };

      const contratoFinal = this.renderTemplate(plantilla.body, dataToTemplate);

      return {
        empresa,
        contrato,
        plantilla,
        contratoFinal,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener datos del contrato',
      );
    }
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\[([^\]]+)\]/g, (_, key) => {
      const value = data[key];
      return value !== undefined ? String(value) : `[${key}]`;
    });
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
}
