import { Inject, Injectable } from '@nestjs/common';
import {
  CONTRATO_FISICO_REPOSITORY,
  ContratoFisicoRepositoryPort,
} from '../../domain/ports/contrato-fisico-repository.port';
import { ContratoFisicoProps } from '../../domain/props/contrato-fisico.props';

@Injectable()
export class GuardarContratoFisicoUseCase {
  constructor(
    @Inject(CONTRATO_FISICO_REPOSITORY)
    private readonly contratos: ContratoFisicoRepositoryPort,
  ) {}

  execute(input: ContratoFisicoProps): Promise<void> {
    return this.contratos.guardar(input);
  }
}
