import { PrepararPrealtaPppoeInput } from '../../application/inputs/preparar-prealta-pppoe.input';
import { PrepararPrealtaPppoeResult } from '../../application/results/preparar-prealta-pppoe.result';

export const PPPOE_PREALTA = Symbol('PPPOE_PREALTA');

export interface PppoePrealtaPort {
  preparar(
    input: PrepararPrealtaPppoeInput,
  ): Promise<PrepararPrealtaPppoeResult>;
}
