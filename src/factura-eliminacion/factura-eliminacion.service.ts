import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateFacturaEliminacionDto } from './dto/create-factura-eliminacion.dto';
import { UpdateFacturaEliminacionDto } from './dto/update-factura-eliminacion.dto';
import { FacturaInternet } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrimerRecordatorioCronService } from 'src/zona-facturacion-cron/primer-recordatorio-cron/primer-recordatorio-cron.service';

@Injectable()
export class FacturaEliminacionService {
  private readonly logger = new Logger(FacturaEliminacionService.name);
  constructor(private readonly prisma: PrismaService) {}
  create(createFacturaEliminacionDto: CreateFacturaEliminacionDto) {
    return 'This action adds a new facturaEliminacion';
  }

  async findAll() {
    try {
      const facturasEliminadas = await this.prisma.facturaEliminada.findMany({
        select: {
          montoPago: true,
          id: true,
          motivo: true,
          fechaEliminacion: true,
          fechaPagoEsperada: true,
          periodo: true,
          facturaInternetId: true,
          usuario: {
            select: {
              id: true,
              nombre: true,
              correo: true,
              rol: true,
            },
          },
        },
      });

      if (!facturasEliminadas) {
        throw new NotFoundException({
          message: 'Registros no encontrados',
          code: 'NOT_FOUND_EXCEPCION',
        });
      }

      return facturasEliminadas;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException({
        message: 'Fatal Error: Error inesperado',
        code: 'UNEXPECTED_ERROR',
      });
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} facturaEliminacion`;
  }

  update(id: number, updateFacturaEliminacionDto: UpdateFacturaEliminacionDto) {
    return `This action updates a #${id} facturaEliminacion`;
  }

  async remove(id: number) {
    try {
      if (!id) {
        throw new NotFoundException({
          message: 'ID no proporcionado',
          code: 'ID_NOT_PROVIDED',
        });
      }

      const Snapshoot = await this.prisma.facturaEliminada.delete({
        where: {
          id,
        },
      });

      if (!Snapshoot) {
        throw new NotFoundException({
          message: 'Registro no encontrado',
          code: 'NOT_FOUND_EXCEPCION',
        });
      }

      return Snapshoot;
    } catch (error) {
      this.logger.debug('El error es: ', error);
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException({
        message: 'Fatal Error: Error inesperado',
        code: 'UNEXPECTED_ERROR',
      });
    }
  }

  async createEliminacionFacturaRegist(
    factura: FacturaInternet,
    userId: number,
    motivo: string,
    facturaId: number,
  ) {
    try {
      if (!factura) {
        throw new BadRequestException({
          message: 'Factura no proporcionada o encontrada.',
          code: 'RECORD_NOT_FOUND',
        });
      }

      const newFacturaEliminada = await this.prisma.facturaEliminada.create({
        data: {
          clienteId: factura.clienteId,
          montoPago: factura.montoPago,
          periodo: factura.periodo,
          fechaPagoEsperada: factura.fechaPagoEsperada,
          facturaInternetId: facturaId,
          usuarioId: userId,
          motivo: motivo,
        },
      });

      if (!newFacturaEliminada) {
        throw new InternalServerErrorException({
          message: 'Error al generar registro de eliminación',
          code: 'CANNOT_CREAT_RECORD',
        });
      }

      return newFacturaEliminada;
    } catch (error) {
      this.logger.error('El error es: ', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        message: 'Error inesperado',
        code: 'UNEXPECTED_ERROR',
      });
    }
  }
}
