import { Inject, Injectable, Logger } from '@nestjs/common';
import { CrearCreditoDto } from '../dto/create-credito.dto';
import { UpdateCreditoDto } from '../dto/update-credito.dto';
import { CREDITO } from '../domain/credito.repository';
import { PrismaCreditoRepository } from '../infraestructure/prisma-credito.repository';
import { Credito } from '../entities/credito.entity';
import Decimal from 'decimal.js';
import { GetCreditosQueryDto } from '../dto/query';

@Injectable()
export class CreditoService {
  private readonly logger = new Logger(CreditoService.name);

  constructor(
    @Inject(CREDITO)
    private readonly creditoRepo: PrismaCreditoRepository,
  ) {}

  async create(dto: CrearCreditoDto) {
    try {
      const entity = Credito.crear({
        clienteId: dto.clienteId,
        fechaInicio: dto.fechaInicio,
        frecuencia: dto.frecuencia,
        interesPorcentaje: new Decimal(dto.interesPorcentaje),
        interesTipo: dto.interesTipo,
        intervaloDias: dto.intervaloDias,
        montoCapital: new Decimal(dto.montoCapital),
        origenCredito: dto.origenCredito,
        plazoCuotas: dto.plazoCuotas,
        creadoPorId: dto.creadoPorId,
        observaciones: dto.observaciones,
      });

      return await this.creditoRepo.save(entity);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async finMany() {
    return await this.creditoRepo.findMany();
  }

  async getClienteCredito(query: GetCreditosQueryDto) {
    return await this.creditoRepo.findByCliente(query.id);
  }
}
