import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateCuotasPagoDto } from '../dto/create-cuotas-pago.dto';
import {
  CUOTA_PAGO,
  CuotaPagoRepository,
} from '../domain/cuota-pago.repository';
import Decimal from 'decimal.js';
import { PayMoraCuotaDto } from '../dto/pay-mora-cuota.dto';

@Injectable()
export class CuotasPagoService {
  private readonly logger = new Logger(CuotasPagoService.name);
  constructor(
    @Inject(CUOTA_PAGO)
    private readonly creditoRepository: CuotaPagoRepository,
  ) {}

  async registrarPago(dto: CreateCuotasPagoDto) {
    this.logger.log(
      `CuotasPagoService.registrarPago:\n${JSON.stringify(dto, null, 2)}`,
    );

    const credito = await this.creditoRepository.findByIdWithCuotas(
      dto.creditoId,
    );

    const resultado = credito.registrarPagoEnCuota({
      cuotaId: dto.cuotaId,
      monto: new Decimal(dto.monto),
    });

    await this.creditoRepository.persistirPago({
      credito,
      cuota: resultado.cuota,
      monto: resultado.montoAplicado,
      dto,
    });
  }

  async deletePago(pagoCuotaId: number) {
    const credito = await this.creditoRepository.findByPagoCuotaId(pagoCuotaId);

    const resultado = credito.eliminarPagoDeCuota({
      pagoCuotaId,
    });

    await this.creditoRepository.persistirEliminacionPago({
      credito,
      cuota: resultado.cuota,
      pagoCuotaId,
    });
  }

  async papagoMoraCuotay(dto: PayMoraCuotaDto) {
    return await this.creditoRepository.payMoraCuota(dto);
  }
}
