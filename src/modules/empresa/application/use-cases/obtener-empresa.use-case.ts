import { Inject, Injectable } from '@nestjs/common';
import { EmpresaNoConfiguradaError } from '../../domain/errors/empresa.errors';
import {
  EMPRESA_REPOSITORY,
  EmpresaRepositoryPort,
} from '../../domain/ports/empresa-repository.port';
import { EmpresaProps } from '../../domain/props/empresa.props';

@Injectable()
export class ObtenerEmpresaUseCase {
  constructor(
    @Inject(EMPRESA_REPOSITORY)
    private readonly empresas: EmpresaRepositoryPort,
  ) {}

  async execute(input: { empresaId: number }): Promise<EmpresaProps> {
    const empresa = await this.empresas.findById(input.empresaId);
    if (!empresa) throw new EmpresaNoConfiguradaError();

    return empresa.toPrimitives();
  }
}
