import { Inject, Injectable } from '@nestjs/common';
import { CreateCuotasPagoDto } from '../dto/create-cuotas-pago.dto';
import { UpdateCuotasPagoDto } from '../dto/update-cuotas-pago.dto';
import { PrismaCuotasPago } from '../infraestructure/prisma-cuotas-pago.repo';
import { CUOTA_PAGO } from '../domain/cuota-pago.repository';
import Decimal from 'decimal.js';
import { CREDITO } from 'src/credito/domain/credito.repository';
import { PrismaCreditoRepository } from 'src/credito/infraestructure/prisma-credito.repository';

@Injectable()
export class CuotasPagoService {
  constructor(
    @Inject(CREDITO)
    private readonly creditoRepository: PrismaCreditoRepository,

    @Inject(CUOTA_PAGO)
    private readonly cuotasPagoRepo: PrismaCuotasPago,
  ) {}

  async registrarPago(dto: CreateCuotasPagoDto) {
    const credito = await this.creditoRepository.findByIdWithCuotas(
      dto.creditoId,
    );

    // 2. Dominio decide
    const resultado = credito.registrarPagoEnCuota({
      cuotaId: dto.cuotaId,
      monto: new Decimal(dto.monto),
    });

    // 3. Persistencia
    await this.cuotasPagoRepo.persistirPago({
      credito,
      cuota: resultado.cuota,
      monto: resultado.montoAplicado,
      dto,
    });
  }
}
