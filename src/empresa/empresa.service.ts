import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { throwFatalError } from 'src/Utils/CommonFatalError';

@Injectable()
export class EmpresaService {
  private readonly logger = new Logger(EmpresaService.name);
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

  // Obtener empresa por ID
  async findOne(id: number) {
    return this.prisma.empresa.findUnique({
      where: { id },
    });
  }

  async getEmpresaInfo(empresaId: number) {
    try {
      this.logger.log('EMPRESA ID: ', empresaId);
      const empresa = await this.prisma.empresa.findUnique({
        where: {
          id: empresaId,
        },
        select: {
          nombre: true,
          id: true,
          logo1: true,
        },
      });

      if (!empresa) throw new NotFoundException('Empresa no encontrada');
      return empresa;
    } catch (error) {
      throwFatalError(error, this.logger, 'Empresa');
    }
  }

  // Actualizar empresa
  async update(id: number, updateEmpresaDto: UpdateEmpresaDto) {
    return this.prisma.empresa.update({
      where: { id },
      data: updateEmpresaDto,
    });
  }
}
