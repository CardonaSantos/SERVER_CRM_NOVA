import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmpresaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEmpresaDto: CreateEmpresaDto) {
    try {
      return await this.prisma.empresa.create({
        data: {
          nombre: createEmpresaDto.nombre,
          direccion: createEmpresaDto.direccion,
          telefono: createEmpresaDto.telefono,
          pbx: createEmpresaDto.pbx,
          correo: createEmpresaDto.correo,
          sitioWeb: createEmpresaDto.sitioWeb,
          nit: createEmpresaDto.nit,
          logo1: createEmpresaDto.logo1,
          logo2: createEmpresaDto.logo2,
          logo3: createEmpresaDto.logo3,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'El nombre de la empresa ya está en uso.',
        );
      }
      throw new InternalServerErrorException('Error al crear la empresa.');
    }
  }

  findAll() {
    return `This action returns all empresa`;
  }

  findOne(id: number) {
    return `This action returns a #${id} empresa`;
  }

  update(id: number, updateEmpresaDto: UpdateEmpresaDto) {
    return `This action updates a #${id} empresa`;
  }

  remove(id: number) {
    return `This action removes a #${id} empresa`;
  }
}
