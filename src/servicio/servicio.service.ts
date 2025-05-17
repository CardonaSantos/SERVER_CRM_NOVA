import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Servicio } from '@prisma/client';

@Injectable()
export class ServicioService {
  constructor(private readonly prisma: PrismaService) {}

  //Crear nuevo servicio
  async create(createServicioDto: CreateServicioDto) {
    return await this.prisma.$transaction(async (tx) => {
      console.log('Los datos de servicio: ', createServicioDto);

      const newServicio = await tx.servicio.create({
        data: {
          nombre: createServicioDto.nombre,
          precio: createServicioDto.precio,
          descripcion: createServicioDto.descripcion,
          estado: 'ACTIVO',
          ...(createServicioDto.tipoServicioId && {
            tipoServicio: {
              connect: {
                id: createServicioDto.tipoServicioId,
              },
            },
          }),
          empresa: {
            connect: {
              id: createServicioDto.empresaId,
            },
          },
        },
      });

      if (!newServicio) {
        throw new InternalServerErrorException('Error al crear nuevo servicio');
      }

      return newServicio;
    });
  }

  async findAll() {
    try {
      // Obtener los servicios de la base de datos
      const servicios = await this.prisma.servicio.findMany({
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          precio: true,
          estado: true,
          tipoServicioId: true,
          empresaId: true,
          creadoEn: true,
          actualizadoEn: true,
          _count: {
            select: {
              clientes: true,
            },
          },
        },
      });

      // Obtener el número de clientes por servicio
      const serviciosConClientesCount = await Promise.all(
        servicios.map(async (servicio) => {
          const { _count, ...rest } = servicio;

          // Devolver cada servicio con su respectivo número de clientes
          return {
            ...rest,
            clientesCount: _count.clientes, // Incluimos los detalles del servicio
          };
        }),
      );

      // Devolver los servicios con el conteo de clientes
      return serviciosConClientesCount;
    } catch (error) {
      console.error('Error al obtener los servicios:', error);
      throw new Error('No se pudo obtener la información de los servicios.');
    }
  }

  async findAllServicios() {
    return await this.prisma.$transaction(async (tx) => {
      const servicios = await tx.servicio.findMany({
        select: {
          id: true,
          nombre: true,
        },
      });

      return servicios;
    });
  }

  async finServiciosToInvoice(id: number) {
    try {
      if (!id) {
        throw new NotFoundException('El id del cliente no puede ser nulo');
      }

      const servicios = await this.prisma.clienteServicio.findMany({
        where: {
          clienteId: id,
        },
        select: {
          creadoEn: true,
          actualizadoEn: true,
          servicio: {
            select: {
              id: true,
              nombre: true,
              precio: true,
              descripcion: true,
              estado: true,
              tipoServicioId: true,
              creadoEn: true,
              actualizadoEn: true,
            },
          },
        },
      });

      const formattedServicios = servicios.map((servicio) => ({
        id: servicio.servicio.id,
        nombre: servicio.servicio.nombre,
        precio: servicio.servicio.precio,
        descripcion: servicio.servicio.descripcion,
        estado: servicio.servicio.estado,
        tipoServicioId: servicio.servicio.tipoServicioId,
        creadoEn: servicio.creadoEn,
        actualizadoEn: servicio.actualizadoEn,
      }));

      return formattedServicios;
    } catch (error) {
      console.error('Error al obtener los servicios:', error);
      throw new Error('No se pudo obtener la información de los servicios.');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} servicio`;
  }

  async update(
    id: number,
    updateServicioDto: UpdateServicioDto,
  ): Promise<Servicio> {
    return await this.prisma.$transaction(async (tx) => {
      const updatedServicio = await tx.servicio.update({
        where: { id },
        data: {
          nombre: updateServicioDto.nombre,
          descripcion: updateServicioDto.descripcion,
          precio: updateServicioDto.precio,
          estado: updateServicioDto.estado,
          // tipoServicio: {
          //   connect: { id: updateServicioDto.tipoServicioId },
          // },
          empresa: {
            connect: { id: updateServicioDto.empresaId },
          },
        },
      });

      console.log('El servicio actualizado es:', updatedServicio);
      return updatedServicio;
    });
  }

  async remove(id: number): Promise<Servicio> {
    return await this.prisma.$transaction(async (tx) => {
      // Verificamos si el servicio existe
      const servicioExistente = await tx.servicio.findUnique({
        where: { id },
      });
      if (!servicioExistente) {
        throw new NotFoundException(`Servicio con id ${id} no encontrado`);
      }

      const servicioEliminado = await tx.servicio.delete({
        where: { id },
      });

      console.log('El servicio eliminado es:', servicioEliminado);
      return servicioEliminado;
    });
  }
}
