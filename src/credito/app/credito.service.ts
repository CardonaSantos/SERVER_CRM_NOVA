import { Inject, Injectable, Logger } from '@nestjs/common';
import { CrearCreditoDto } from '../dto/create-credito.dto';
import { CREDITO, CreditoRepository } from '../domain/credito.repository';
import { Credito } from '../entities/credito.entity';
import Decimal from 'decimal.js';
import { CreditoCuotasService } from 'src/credito/credito-cuotas/app/credito-cuotas.service';
import { GetCreditosQueryDto } from '../dto/get-creditos-query.dto';

@Injectable()
export class CreditoService {
  private readonly logger = new Logger(CreditoService.name);
  constructor(
    private readonly creditoCuotasService: CreditoCuotasService,

    @Inject(CREDITO)
    private readonly creditoRepo: CreditoRepository,
  ) {}

  async create(dto: CrearCreditoDto) {
    const engancheMonto =
      dto.engancheMonto && dto.engancheMonto.trim() !== ''
        ? new Decimal(dto.engancheMonto)
        : new Decimal(0);

    const interesMoraPorcentaje =
      dto.interesMoraPorcentaje && dto.interesMoraPorcentaje.trim() !== ''
        ? new Decimal(dto.interesMoraPorcentaje)
        : new Decimal(0);

    const montoCapital =
      dto.montoCapital && dto.montoCapital.trim() !== ''
        ? new Decimal(dto.montoCapital)
        : new Decimal(0);

    const interesPorcentaje =
      dto.interesPorcentaje && dto.interesPorcentaje.trim() !== ''
        ? new Decimal(dto.interesPorcentaje)
        : new Decimal(0);

    try {
      const credito = Credito.crear({
        clienteId: dto.clienteId,
        fechaInicio: new Date(dto.fechaInicio),
        frecuencia: dto.frecuencia,
        interesPorcentaje: interesPorcentaje,
        interesMoraPorcentaje: interesMoraPorcentaje,
        engancheMonto: engancheMonto,
        interesTipo: dto.interesTipo,
        intervaloDias: dto.intervaloDias,
        montoCapital: montoCapital,
        origenCredito: dto.origenCredito,
        plazoCuotas: dto.plazoCuotas,
        creadoPorId: dto.creadoPorId,
        observaciones: dto.observaciones,
      });

      const creditoPersistido = await this.creditoRepo.save(credito);
      const isCuotasCustom =
        dto.cuotasCustom.length > 0 && dto.tipoGeneracionCuotas === 'CUSTOM';

      if (isCuotasCustom) {
        await this.creditoCuotasService.crearCustom(
          creditoPersistido.getId(),
          dto.cuotasCustom,
        );
      } else {
        await this.creditoCuotasService.crearAutomaticas(creditoPersistido);
      }

      return creditoPersistido;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async finMany(query: GetCreditosQueryDto) {
    return await this.creditoRepo.findAll(query);
  }

  async getCredito(id: number) {
    return await this.creditoRepo.findById(id);
  }

  async deleteAll() {
    return await this.creditoRepo.deleteAll();
  }

  async verifyCustomer() {
    // return await this.cre
  }
}
