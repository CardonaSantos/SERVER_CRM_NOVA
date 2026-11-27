import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  inicioDeMes,
  sumarDias,
} from '../../domain/policies/calendario.policy';
import { actividadDelMes } from '../../domain/policies/instalaciones.policy';
import {
  INSTALACIONES_QUERY,
  InstalacionesQueryPort,
} from '../../domain/ports/instalaciones-query.port';
import { InstalacionesMesReadModel } from '../../domain/read-models/instalaciones.read-model';

@Injectable()
export class ObtenerInstalacionesMesUseCase {
  constructor(
    @Inject(INSTALACIONES_QUERY)
    private readonly trabajos: InstalacionesQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(): Promise<InstalacionesMesReadModel> {
    const hoy = this.reloj.fechaOperativa();
    const datos = await this.trabajos.findFinalizadas({
      desde: inicioDeMes(hoy),
      hastaExclusivo: sumarDias(hoy, 1),
    });

    return actividadDelMes(hoy, datos);
  }
}
