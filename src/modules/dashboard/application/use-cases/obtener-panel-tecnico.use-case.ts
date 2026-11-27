import { Inject, Injectable } from '@nestjs/common';
import { inicioDiaNegocio } from 'src/common/reloj/fecha-negocio';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { DashboardUsuarioNoEncontradoError } from '../../domain/errors/dashboard.errors';
import {
  diaDelMes,
  inicioDeMes,
  sumarDias,
  sumarMeses,
} from '../../domain/policies/calendario.policy';
import { productividadDelMes } from '../../domain/policies/panel-tecnico.policy';
import {
  PANEL_TECNICO_QUERY,
  PanelTecnicoQueryPort,
} from '../../domain/ports/panel-tecnico-query.port';
import { PanelTecnicoReadModel } from '../../domain/read-models/panel-tecnico.read-model';

const MS_48_HORAS = 48 * 60 * 60 * 1000;

@Injectable()
export class ObtenerPanelTecnicoUseCase {
  constructor(
    @Inject(PANEL_TECNICO_QUERY)
    private readonly panel: PanelTecnicoQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  /** El panel es siempre el de quien tiene la sesión. */
  async execute(input: { usuarioId: number }): Promise<PanelTecnicoReadModel> {
    const tecnico = await this.panel.findTecnico(input.usuarioId);
    if (!tecnico) throw new DashboardUsuarioNoEncontradoError();

    const hoy = this.reloj.fechaOperativa();
    const inicioMes = inicioDeMes(hoy);
    const mes = {
      desde: inicioMes,
      hastaExclusivo: sumarMeses(inicioMes, 1),
    };

    const [cargaActual, tickets, instalaciones] = await Promise.all([
      this.panel.contarCarga({
        tecnicoId: input.usuarioId,
        hoy: { desde: hoy, hastaExclusivo: sumarDias(hoy, 1) },
        hace48Horas: new Date(this.reloj.ahora().getTime() - MS_48_HORAS),
      }),
      this.panel.findTicketsResueltos(input.usuarioId, mes),
      this.panel.findInstalacionesCompletadas(input.usuarioId, mes),
    ]);

    return {
      tecnico,
      periodo: {
        inicioMes: inicioDiaNegocio(mes.desde),
        finMes: inicioDiaNegocio(mes.hastaExclusivo),
        diasTranscurridos: diaDelMes(hoy),
      },
      cargaActual,
      ...productividadDelMes(hoy, tickets, instalaciones),
    };
  }
}
