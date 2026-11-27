import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { ContratoClienteEntity } from '../../domain/entities/contrato-cliente.entity';
import { ContratoClienteNoEncontradoError } from '../../domain/errors/contrato-cliente.errors';
import {
  CONTRATO_CLIENTE_REPOSITORY,
  ContratoClienteRepositoryPort,
} from '../../domain/ports/contrato-cliente-repository.port';
import { CrearContratoClienteProps } from '../../domain/props/contrato-cliente.props';

export type CrearContratoClienteInput = CrearContratoClienteProps;

@Injectable()
export class CrearContratoClienteUseCase {
  constructor(
    @Inject(CONTRATO_CLIENTE_REPOSITORY)
    private readonly contratos: ContratoClienteRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CrearContratoClienteInput,
  ): Promise<ContratoClienteEntity> {
    const contrato = ContratoClienteEntity.create(input, this.reloj.ahora());

    if (!(await this.contratos.existeClienteVigente(contrato.clienteId))) {
      throw new ContratoClienteNoEncontradoError();
    }

    return this.contratos.create(contrato);
  }
}
