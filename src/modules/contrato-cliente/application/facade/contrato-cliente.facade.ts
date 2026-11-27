import { Injectable } from '@nestjs/common';
import {
  ContratoClienteFacadePort,
  GuardarContratoFisicoInput,
} from '../../public/contrato-cliente.facade.port';
import { GuardarContratoFisicoUseCase } from '../use-cases/guardar-contrato-fisico.use-case';

@Injectable()
export class ContratoClienteFacade implements ContratoClienteFacadePort {
  constructor(private readonly guardarFisico: GuardarContratoFisicoUseCase) {}

  guardarContratoFisico(input: GuardarContratoFisicoInput): Promise<void> {
    return this.guardarFisico.execute(input);
  }
}
