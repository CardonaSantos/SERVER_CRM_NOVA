import { Inject, Injectable, Logger } from '@nestjs/common';
import { CrearCreditoDto } from '../dto/create-credito.dto';
import { CREDITO } from '../domain/credito.repository';
import { PrismaCreditoRepository } from '../infraestructure/prisma-credito.repository';
import { Credito } from '../entities/credito.entity';
import Decimal from 'decimal.js';
import { GetCreditosQueryDto } from '../dto/query';
import { CreditoCuotasService } from 'src/credito/credito-cuotas/app/credito-cuotas.service';

@Injectable()
export class CreditoService {
  private readonly logger = new Logger(CreditoService.name);
  constructor(
    @Inject(CREDITO)
    private readonly creditoRepo: PrismaCreditoRepository,
    private readonly creditoCuotasService: CreditoCuotasService,
  ) {}

  async create(dto: CrearCreditoDto) {
    try {
      const entity = Credito.crear({
        clienteId: dto.clienteId,
        fechaInicio: dto.fechaInicio,
        frecuencia: dto.frecuencia,
        interesPorcentaje: new Decimal(dto.interesPorcentaje),
        interesMoraPorcentaje: new Decimal(dto.interesMoraPorcentaje),
        engancheMonto: new Decimal(dto.engancheMonto),
        interesTipo: dto.interesTipo,
        intervaloDias: dto.intervaloDias,
        montoCapital: new Decimal(dto.montoCapital),
        origenCredito: dto.origenCredito,
        plazoCuotas: dto.plazoCuotas,
        creadoPorId: dto.creadoPorId,
        observaciones: dto.observaciones,
      });

      const isCuotasCustom =
        dto.cuotasCustom.length > 0 && dto.tipoGeneracionCuotas === 'CUSTOM';

      if (isCuotasCustom) {
        await this.creditoCuotasService.create(dto.cuotasCustom);
      }

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
