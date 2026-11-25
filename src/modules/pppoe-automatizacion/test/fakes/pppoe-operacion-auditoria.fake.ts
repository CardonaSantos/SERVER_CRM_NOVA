import {
  PppoeOperacionAuditoriaPort,
  RegistrarAuditoriaOperacionPppoeParams,
  RegistrarAuditoriaRecuperacionPppoeParams,
  RegistrarAuditoriaReintentoPppoeParams,
} from '../../application/ports/pppoe-operacion-auditoria.port';

type Evento =
  | 'CREADA'
  | 'INICIADA'
  | 'FINALIZADA'
  | 'REINTENTADA'
  | 'RECUPERADA';

/** Auditoría de operaciones que solo anota los eventos en orden. */
export class PppoeOperacionAuditoriaFake
  implements PppoeOperacionAuditoriaPort
{
  readonly eventos: {
    evento: Evento;
    params: RegistrarAuditoriaOperacionPppoeParams;
  }[] = [];

  get nombres(): Evento[] {
    return this.eventos.map((e) => e.evento);
  }

  registrarCreada(params: RegistrarAuditoriaOperacionPppoeParams) {
    return this.anotar('CREADA', params);
  }

  registrarIniciada(params: RegistrarAuditoriaOperacionPppoeParams) {
    return this.anotar('INICIADA', params);
  }

  registrarFinalizada(params: RegistrarAuditoriaOperacionPppoeParams) {
    return this.anotar('FINALIZADA', params);
  }

  registrarReintentada(params: RegistrarAuditoriaReintentoPppoeParams) {
    return this.anotar('REINTENTADA', params);
  }

  registrarRecuperada(params: RegistrarAuditoriaRecuperacionPppoeParams) {
    return this.anotar('RECUPERADA', params);
  }

  private anotar(
    evento: Evento,
    params: RegistrarAuditoriaOperacionPppoeParams,
  ): Promise<void> {
    this.eventos.push({ evento, params });
    return Promise.resolve();
  }
}
