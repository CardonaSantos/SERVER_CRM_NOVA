import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServicioInternetDto } from './dto/create-servicio-internet.dto';
import { UpdateServicioInternetDto } from './dto/update-servicio-internet.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EstadoServicio, ServicioInternet } from '@prisma/client';

@Injectable()
export class ServicioInternetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createServicioInternetDto: CreateServicioInternetDto,
  ): Promise<ServicioInternet> {
    console.log('entrando al servicio de internet');

    return await this.prisma.$transaction(async (prisma) => {
      const servicio = await prisma.servicioInternet.create({
        data: {
          nombre: createServicioInternetDto.nombre,
          velocidad: createServicioInternetDto.velocidad,
          precio: createServicioInternetDto.precio,
          estado: createServicioInternetDto.estado || EstadoServicio.ACTIVO,
          // Conectar la empresa mediante su ID
          empresa: { connect: { id: createServicioInternetDto.empresaId } },
        },
      });
      console.log('el nuevo servicio es: ', servicio);

      return servicio;
    });
  }

  async findAll(): Promise<ServicioInternet[]> {
    return await this.prisma.$transaction(async (prisma) => {
      return await prisma.servicioInternet.findMany({
        include: {
          // Relación 1:1 con clienteInternet
          // clienteInternet: true, // Relacionado 1:1 con el cliente
          clientes: true,
        },
      });
    });
  }

  async findAllServicesToCreateCustomer() {
    return await this.prisma.$transaction(async (prisma) => {
      return await prisma.servicioInternet.findMany({
        orderBy: {
          creadoEn: 'desc',
        },
        select: {
          id: true,
          nombre: true,
          velocidad: true,
        },
      });
    });
  }

  async getServiciosInternet() {
    try {
      // Obtener los servicios de internet
      const response = await this.prisma.servicioInternet.findMany({
        select: {
          id: true,
          nombre: true,
          velocidad: true,
          precio: true,
          estado: true,
          empresaId: true,
          creadoEn: true,
          actualizadoEn: true,
        },
      });

      // Obtener la cantidad de clientes por cada servicio de internet
      const resultado = await Promise.all(
        response.map(async (servicio) => {
          // Contar los clientes que tienen asignado este servicio de internet (1:1)
          const clientesCount = await this.prisma.clienteInternet.count({
            where: {
              servicioInternetId: servicio.id, // Relación 1:1 con servicioInternetId
            },
          });

          return {
            ...servicio, // El servicio original
            clientesCount, // El conteo de clientes asociados a este servicio
          };
        }),
      );

      return resultado; // Resultado final con los servicios y la cantidad de clientes
    } catch (error) {
      console.error('Error al obtener servicios de Internet:', error);
      throw new Error('No se pudo obtener los servicios de Internet.');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} servicioInternet`;
  }

  async update(
    id: number,
    updateServicioInternetDto: UpdateServicioInternetDto,
  ): Promise<ServicioInternet> {
    return await this.prisma.$transaction(async (prisma) => {
      const servicio = await prisma.servicioInternet.update({
        where: { id },
        data: {
          nombre: updateServicioInternetDto.nombre,
          velocidad: updateServicioInternetDto.velocidad,
          precio: updateServicioInternetDto.precio,
          estado: updateServicioInternetDto.estado,
          empresa: { connect: { id: updateServicioInternetDto.empresaId } },
        },
      });
      console.log('El servicio actualizado es:', servicio);
      return servicio;
    });
  }

  async remove(id: number): Promise<ServicioInternet> {
    return await this.prisma.$transaction(async (prisma) => {
      // Verificamos si existe el servicio
      const servicioExistente = await prisma.servicioInternet.findUnique({
        where: { id },
      });
      if (!servicioExistente) {
        throw new NotFoundException(
          `Servicio de internet con id ${id} no encontrado`,
        );
      }

      // Eliminamos el servicio
      const servicioEliminado = await prisma.servicioInternet.delete({
        where: { id },
      });
      console.log('El servicio eliminado es:', servicioEliminado);
      return servicioEliminado;
    });
  }
}
