import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateTipoServicioDto } from './dto/create-tipo-servicio.dto';
import { UpdateTipoServicioDto } from './dto/update-tipo-servicio.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TipoServicioService {
  constructor(private readonly prisma: PrismaService) {}

  //nuevo servicio
  async create(createTipoServicioDto: CreateTipoServicioDto) {
    return await this.prisma.$transaction(async (tx) => {
      console.log('Los datos de tipo servicio: ', createTipoServicioDto);
      const newTipoServicio = await tx.tipoServicio.create({
        data: {
          nombre: createTipoServicioDto.nombre,
          descripcion: createTipoServicioDto.descripcion,
          estado: 'ACTIVO',
        },
      });

      if (!newTipoServicio) {
        throw new InternalServerErrorException('Error al crear nuevo servicio');
      }

      return newTipoServicio;
    });
  }

  async findAll() {
    return await this.prisma.tipoServicio.findMany({});
  }

  findOne(id: number) {
    return `This action returns a #${id} tipoServicio`;
  }

  update(id: number, updateTipoServicioDto: UpdateTipoServicioDto) {
    return `This action updates a #${id} tipoServicio`;
  }

  remove(id: number) {
    return `This action removes a #${id} tipoServicio`;
  }
}
