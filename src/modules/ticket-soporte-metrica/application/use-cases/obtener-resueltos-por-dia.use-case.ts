import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { periodoDeMes } from '../../domain/policies/fechas.policy';
import {
  resueltoEn,
  resueltosPorDia,
} from '../../domain/policies/rendimiento.policy';
import {
  METRICA_TICKET_QUERY,
  MetricaTicketQueryPort,
} from '../../domain/ports/metrica-ticket-query.port';
import { TecnicoMetrica } from '../../domain/read-models/meta-ticket.read-model';
import { ResueltosDia } from '../../domain/read-models/metrica-ticket.read-model';

export type ResueltosPorDiaResult = {
  mes: string;
  /** Quienes resolvieron algo en el mes. */
  tecnicos: TecnicoMetrica[];
  dias: ResueltosDia[];
};

@Injectable()
export class ObtenerResueltosPorDiaUseCase {
  constructor(
    @Inject(METRICA_TICKET_QUERY)
    private readonly consulta: MetricaTicketQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: { mes?: string }): Promise<ResueltosPorDiaResult> {
    const mes = input.mes ?? this.reloj.fechaOperativa().slice(0, 7);
    const periodo = periodoDeMes(mes);
    const resueltos = (await this.consulta.ticketsDelPeriodo(periodo)).filter(
      (t) => resueltoEn(t, periodo),
    );

    const ids = new Set(resueltos.flatMap((t) => t.tecnicoIds));
    const tecnicos = (await this.consulta.tecnicos([...ids]))
      .filter((t) => ids.has(t.id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    return { mes, tecnicos, dias: resueltosPorDia(resueltos, periodo) };
  }
}
