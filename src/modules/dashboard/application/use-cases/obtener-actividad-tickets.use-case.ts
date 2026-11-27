import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { PresetActividad } from '../../domain/enums/preset-actividad.enum';
import {
  armarActividad,
  resolverRango,
} from '../../domain/policies/actividad-tickets.policy';
import {
  ACTIVIDAD_TICKETS_QUERY,
  ActividadTicketsQueryPort,
} from '../../domain/ports/actividad-tickets-query.port';
import { ActividadTicketsReadModel } from '../../domain/read-models/actividad-tickets.read-model';

const MS_48_HORAS = 48 * 60 * 60 * 1000;

export type ObtenerActividadTicketsInput = {
  preset?: PresetActividad;
  /** `YYYY-MM-DD`; solo con el rango personalizado. */
  desde?: string;
  hasta?: string;
};

@Injectable()
export class ObtenerActividadTicketsUseCase {
  constructor(
    @Inject(ACTIVIDAD_TICKETS_QUERY)
    private readonly tickets: ActividadTicketsQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: ObtenerActividadTicketsInput,
  ): Promise<ActividadTicketsReadModel> {
    const preset = input.preset ?? PresetActividad.ULTIMOS_7_DIAS;

    const rango = resolverRango({
      preset,
      desde: input.desde,
      hasta: input.hasta,
      hoy: this.reloj.fechaOperativa(),
      primerTicket:
        preset === PresetActividad.HISTORICO
          ? await this.tickets.findPrimeraApertura()
          : null,
    });
    // Se consulta de una vez el período y el que se compara con él.
    const consulta = {
      desde: rango.comparacion?.desde ?? rango.desde,
      hastaExclusivo: rango.hastaExclusivo,
    };

    const [creados, resueltos, pendientes] = await Promise.all([
      this.tickets.findCreados(consulta),
      this.tickets.findResueltos(consulta),
      this.tickets.findPendientes(),
    ]);

    return armarActividad(
      rango,
      { creados, resueltos, pendientes },
      new Date(this.reloj.ahora().getTime() - MS_48_HORAS),
    );
  }
}
