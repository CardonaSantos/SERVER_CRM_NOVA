import { Injectable } from '@nestjs/common';
import {
  RutaCobroFacadePort,
  VerificarCobroRutaInput,
} from '../../public/ruta-cobro.facade.port';
import { VerificarCobroRutaUseCase } from '../use-cases/verificar-cobro-ruta.use-case';

@Injectable()
export class RutaCobroFacade implements RutaCobroFacadePort {
  constructor(private readonly verificar: VerificarCobroRutaUseCase) {}

  verificarCobro(input: VerificarCobroRutaInput): Promise<boolean> {
    return this.verificar.execute(input);
  }
}
