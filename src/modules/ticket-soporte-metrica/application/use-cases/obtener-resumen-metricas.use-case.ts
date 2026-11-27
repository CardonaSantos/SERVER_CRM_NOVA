import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  diasEntre,
  diasTranscurridos,
  periodoDeMes,
} from '../../domain/policies/fechas.policy';
import {
  rendimientoPorTecnico,
  resueltoEn,
} from '../../domain/policies/rendimiento.policy';
import {
  METRICA_TICKET_QUERY,
  MetricaTicketQueryPort,
} from '../../domain/ports/metrica-ticket-query.port';
import {
  RendimientoTecnico,
  SituacionTickets,
} from '../../domain/read-models/metrica-ticket.read-model';

export type ResumenMetricasResult = {
  mes: string;
  desde: string;
  hasta: string;
  diasTotales: number;
  diasTranscurridos: number;
  /** Tickets distintos resueltos en el mes. */
  resueltosDelMes: number;
  /** Situación de hoy; no depende del mes pedido. */
  ahora: SituacionTickets;
  tecnicos: RendimientoTecnico[];
};

@Injectable()
export class ObtenerResumenMetricasUseCase {
  constructor(
    @Inject(METRICA_TICKET_QUERY)
    private readonly consulta: MetricaTicketQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  /** Sin `mes` (`YYYY-MM`), el actual en Guatemala. */
  async execute(input: { mes?: string }): Promise<ResumenMetricasResult> {
    const hoy = this.reloj.fechaOperativa();
    const mes = input.mes ?? hoy.slice(0, 7);
    const periodo = periodoDeMes(mes);

    const [tickets, ahora] = await Promise.all([
      this.consulta.ticketsDelPeriodo(periodo),
      this.consulta.situacion(hoy),
    ]);
    const tecnicos = await this.consulta.tecnicos([
      ...new Set(tickets.flatMap((t) => t.tecnicoIds)),
    ]);

    return {
      mes,
      ...periodo,
      diasTotales: diasEntre(periodo.desde, periodo.hasta),
      diasTranscurridos: diasTranscurridos(periodo.desde, periodo.hasta, hoy),
      resueltosDelMes: tickets.filter((t) => resueltoEn(t, periodo)).length,
      ahora,
      tecnicos: rendimientoPorTecnico(tecnicos, tickets, periodo, hoy),
    };
  }
}
