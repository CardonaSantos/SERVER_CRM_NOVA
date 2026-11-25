import { PppoeOperacionPasoEntity } from '../entities/pppoe-operacion-paso.entity';
import { PppoeOperacionEntity } from '../entities/pppoe-operacion.entity';
import { PppoeOperacionPasoProps } from '../props/pppoe-operacion-paso.props';
import { PppoeOperacionProps } from '../props/pppoe-operacion.props';

/** Foto de una operación persistida, con las preguntas de estado ya resueltas. */
export type PppoeOperacionReadModel = Omit<PppoeOperacionProps, 'id'> & {
  id: number;
  estaPendiente: boolean;
  estaAutorizada: boolean;
  estaEjecutando: boolean;
  estaEnCurso: boolean;
  esTerminal: boolean;
  puedeReintentarse: boolean;
  esReintento: boolean;
};

export type PppoeOperacionPasoReadModel = Omit<
  PppoeOperacionPasoProps,
  'id'
> & {
  id: number;
  estaPendiente: boolean;
  estaEjecutando: boolean;
  fueExitoso: boolean;
  fueFallido: boolean;
  fueOmitido: boolean;
  esTerminal: boolean;
};

export type PppoeOperacionAgregadoReadModel = {
  operacion: PppoeOperacionReadModel;
  pasos: PppoeOperacionPasoReadModel[];
};

export function aPppoeOperacionReadModel(
  operacion: PppoeOperacionEntity,
): PppoeOperacionReadModel {
  const { id, ...resto } = operacion.toPrimitives();
  if (id === null) throw new Error('Una operación sin id no está persistida.');

  return {
    ...resto,
    id,
    estaPendiente: operacion.estaPendiente(),
    estaAutorizada: operacion.estaAutorizada(),
    estaEjecutando: operacion.estaEjecutando(),
    estaEnCurso: operacion.estaEnCurso(),
    esTerminal: operacion.esTerminal(),
    puedeReintentarse: operacion.puedeReintentarse(),
    esReintento: operacion.esReintento(),
  };
}

export function aPppoeOperacionPasoReadModel(
  paso: PppoeOperacionPasoEntity,
): PppoeOperacionPasoReadModel {
  const { id, ...resto } = paso.toPrimitives();
  if (id === null) throw new Error('Un paso sin id no está persistido.');

  return {
    ...resto,
    id,
    estaPendiente: paso.estaPendiente(),
    estaEjecutando: paso.estaEjecutando(),
    fueExitoso: paso.fueExitoso(),
    fueFallido: paso.fueFallido(),
    fueOmitido: paso.fueOmitido(),
    esTerminal: paso.esTerminal(),
  };
}

export function aPppoeOperacionAgregadoReadModel(agregado: {
  operacion: PppoeOperacionEntity;
  pasos: PppoeOperacionPasoEntity[];
}): PppoeOperacionAgregadoReadModel {
  return {
    operacion: aPppoeOperacionReadModel(agregado.operacion),
    pasos: agregado.pasos.map(aPppoeOperacionPasoReadModel),
  };
}
