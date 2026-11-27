import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { sumarDias } from '../../domain/policies/calendario.policy';
import {
  actividadHistorica,
  inicioHistorico,
} from '../../domain/policies/instalaciones.policy';
import {
  INSTALACIONES_QUERY,
  InstalacionesQueryPort,
} from '../../domain/ports/instalaciones-query.port';
import { InstalacionesHistoricasReadModel } from '../../domain/read-models/instalaciones.read-model';

@Injectable()
export class ObtenerInstalacionesHistoricasUseCase {
  constructor(
    @Inject(INSTALACIONES_QUERY)
    private readonly trabajos: InstalacionesQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(): Promise<InstalacionesHistoricasReadModel> {
    const hoy = this.reloj.fechaOperativa();
    const datos = await this.trabajos.findFinalizadas({
      desde: inicioHistorico(hoy),
      hastaExclusivo: sumarDias(hoy, 1),
    });

    return actividadHistorica(hoy, datos);
  }
}
