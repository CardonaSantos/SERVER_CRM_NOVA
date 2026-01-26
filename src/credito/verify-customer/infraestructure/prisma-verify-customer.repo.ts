import { throwFatalError } from 'src/Utils/CommonFatalError';
import { verifyCustomerRepository } from '../domain/verify-customer.repo';
import { verifyClientDto } from '../dto/verify-customer.dto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PrismaVerifyCustomerRepository
  implements verifyCustomerRepository
{
  private readonly logger = new Logger(PrismaVerifyCustomerRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async verifyCustomer(dto: verifyClientDto) {
    try {
      const { id } = dto;
      const client = await this.prisma.clienteInternet.findUnique({
        where: {
          id,
          estadoCliente: {
            in: ['ACTIVO', 'PAGO_PENDIENTE', 'PENDIENTE_ACTIVO'],
          },
        },
        select: {
          creadoEn: true,
          actualizadoEn: true,
          factura: {
            select: {
              id: true,
              estado: true,
              fechaEmision: true,
              fechaVencimiento: true,
              pagos: {
                where: {},
                select: {
                  id: true,
                  fechaPago: true,
                  montoPagado: true,
                },
              },
            },
          },
        },
      });

      if (!client) throw new NotFoundException('Cliente no encontrado');
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaVerifyCustomerRepository.verifyCustomer',
      );
    }
  }
}
