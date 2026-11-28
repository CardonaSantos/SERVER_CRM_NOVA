import { Injectable } from '@nestjs/common';

import {
  ordenarEtapas,
  validarEtapaNueva,
} from '../../domain/policies/jornada.policy';
import { RegistrarEtapaInput } from '../../public/tareas-programadas.facade.port';

/**
 * Etapas de la jornada que registraron los módulos al iniciar. Vive en
 * memoria: cada instancia del servidor registra las mismas al arrancar.
 */
@Injectable()
export class RegistroEtapasJornadaService {
  private readonly etapas: RegistrarEtapaInput[] = [];

  registrar(etapa: RegistrarEtapaInput): void {
    validarEtapaNueva(etapa, this.etapas);
    this.etapas.push({ ...etapa });
  }

  /** Copia en el orden en que corren. */
  enOrden(): RegistrarEtapaInput[] {
    return ordenarEtapas(this.etapas);
  }
}
