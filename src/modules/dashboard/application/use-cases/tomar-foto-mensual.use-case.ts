import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { FotoMensualCarteraEntity } from '../../domain/entities/foto-mensual-cartera.entity';
import { sumarDias } from '../../domain/policies/calendario.policy';
import {
  cifrasFotoMensual,
  mesQueCierra,
} from '../../domain/policies/foto-mensual.policy';
import {
  FINANZAS_QUERY,
  FinanzasQueryPort,
} from '../../domain/ports/finanzas-query.port';
import {
  FOTO_MENSUAL_CARTERA_REPOSITORY,
  FotoMensualCarteraRepositoryPort,
} from '../../domain/ports/foto-mensual-cartera-repository.port';
import {
  RESUMEN_QUERY,
  ResumenQueryPort,
} from '../../domain/ports/resumen-query.port';

export type TomarFotoMensualResult = {
  /** `YYYY-MM` del mes que cerró. */
  mes: string;
  /** `false` si ese mes ya tenía foto (no se reemplaza). */
  guardada: boolean;
};

/**
 * Foto de la cartera del mes que acaba de cerrar (se toma el día 1 de
 * madrugada, antes de la jornada): estados de los clientes y deuda.
 */
@Injectable()
export class TomarFotoMensualUseCase {
  constructor(
    @Inject(RESUMEN_QUERY) private readonly resumen: ResumenQueryPort,
    @Inject(FINANZAS_QUERY) private readonly finanzas: FinanzasQueryPort,
    @Inject(FOTO_MENSUAL_CARTERA_REPOSITORY)
    private readonly fotos: FotoMensualCarteraRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(): Promise<TomarFotoMensualResult> {
    const hoy = this.reloj.fechaOperativa();
    const mes = mesQueCierra(hoy);

    const [clientes, facturas] = await Promise.all([
      this.resumen.findDatos({ desde: hoy, hastaExclusivo: sumarDias(hoy, 1) }),
      this.finanzas.findFacturasSinPagar(),
    ]);

    const foto = FotoMensualCarteraEntity.tomar(
      cifrasFotoMensual(mes, clientes, facturas, hoy),
      this.reloj.ahora(),
    );

    return { mes, guardada: await this.fotos.guardarSiNoExiste(foto) };
  }
}
