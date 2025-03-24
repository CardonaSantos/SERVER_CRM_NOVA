import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { PrismaService } from 'src/prisma/prisma.service';

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
          tipoServicio: {
            connect: {
              id: createServicioDto.tipoServicioId,
            },
          },
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
        },
      });

      // Obtener el número de clientes por servicio
      const serviciosConClientesCount = await Promise.all(
        servicios.map(async (servicio) => {
          // Contar los clientes asociados a este servicio
          const clientesCount = await this.prisma.clienteInternet.count({
            where: {
              clienteServicios: {
                some: {
                  id: servicio.id, // Buscar clientes con este servicio
                },
              },
            },
          });

          // Devolver cada servicio con su respectivo número de clientes
          return {
            ...servicio, // Incluimos los detalles del servicio
            clientesCount, // Incluimos el conteo de clientes
          };
        }),
      );

      console.log('Lo que devolveremos al UI:', serviciosConClientesCount);

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

  findOne(id: number) {
    return `This action returns a #${id} servicio`;
  }

  update(id: number, updateServicioDto: UpdateServicioDto) {
    return `This action updates a #${id} servicio`;
  }

  remove(id: number) {
    return `This action removes a #${id} servicio`;
  }
}
