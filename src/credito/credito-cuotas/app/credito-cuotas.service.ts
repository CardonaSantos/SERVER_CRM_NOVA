import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateCreditoCuotaDto } from '../dto/create-credito-cuota.dto';
import { UpdateCreditoCuotaDto } from '../dto/update-credito-cuota.dto';
import { CreateCuotaCustomDto } from 'src/credito/credito-cuotas/dto/create-cuota-custom.dto';
import { CREDITO_CUOTA, CuotaCredito } from '../entities/credito-cuota.entity';
import { PrismaCuotaCreditoRepository } from '../infraestructure/prisma-cuota-credito.repository';
import { CuotaCreditoRepository } from '../domain/credito-cuota.repository';
import { Credito } from 'src/credito/entities/credito.entity';

// SETUP DAYJS
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import { Decimal } from '@prisma/client/runtime/library';
import { CREDITO } from 'src/credito/domain/credito.repository';
import { CuotaCreditoMapper } from 'src/credito/credito-cuotas/infraestructure/cuota-credito.mapper.ts';
import { CuotaCustomDto } from 'src/credito/dto/create-credito.dto';
import { FrecuenciaPago } from '@prisma/client';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('America/Guatemala');

@Injectable()
export class CreditoCuotasService {
  private readonly logger = new Logger(CreditoCuotasService.name);
  constructor(
    @Inject(CREDITO_CUOTA)
    private readonly cuotaRepo: CuotaCreditoRepository,
  ) {}

  async crearAutomaticas(credito: Credito) {
    const cuotas: CuotaCredito[] = [];
    let fecha = dayjs(credito.getFechaInicio());
    let calculoFecha = this.calculateDaysAmount(credito.getFrecuencia(), fecha);
    let fechaInicial = calculoFecha.fecha;

    //calculo
    const capitalFinanciado = credito
      .getMontoCapital()
      .minus(credito.getEngancheMonto());

    const capitalPorCuota = capitalFinanciado.div(credito.getPlazoCuotas());
    const interesTotal = credito.getMontoTotal().minus(capitalFinanciado);

    const interesPorCuota = interesTotal.div(credito.getPlazoCuotas());

    for (let i = 1; i <= credito.getPlazoCuotas(); i++) {
      cuotas.push(
        CuotaCredito.crear({
          creditoId: credito.getId()!,
          numeroCuota: i,
          fechaVenc: fechaInicial.toDate(),
          montoCapital: capitalPorCuota,
          montoInteres: interesPorCuota,
        }),
      );

      fechaInicial = fechaInicial.add(calculoFecha.cantidadDias, 'day');
    }
    await this.cuotaRepo.saveMany(cuotas);
  }

  // helper dates amount
  calculateDaysAmount(frecuencia: FrecuenciaPago, fecha: dayjs.Dayjs) {
    switch (frecuencia) {
      case 'SEMANAL':
        return {
          fecha: dayjs(fecha).add(7, 'day'),
          cantidadDias: 7,
        };

      case 'QUINCENAL':
        return {
          fecha: dayjs(fecha).add(15, 'day'),
          cantidadDias: 15,
        };

      case 'MENSUAL':
        return {
          fecha: dayjs(fecha).add(30, 'day'),
          cantidadDias: 30,
        };

      default:
        break;
    }
  }

  async crearCustom(creditoId: number, cuotasCustom: CuotaCustomDto[]) {
    const cuotas = cuotasCustom.map((c) =>
      CuotaCredito.crear({
        creditoId,
        numeroCuota: c.numeroCuota,
        fechaVenc: new Date(c.fechaVencimiento),
        montoCapital: new Decimal(c.montoCapital),
        montoInteres: new Decimal(0),
      }),
    );

    await this.cuotaRepo.saveMany(cuotas);
  }
}
