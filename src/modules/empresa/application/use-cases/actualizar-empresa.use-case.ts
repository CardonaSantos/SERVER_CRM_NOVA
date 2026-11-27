import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { EmpresaNoConfiguradaError } from '../../domain/errors/empresa.errors';
import {
  EMPRESA_REPOSITORY,
  EmpresaRepositoryPort,
} from '../../domain/ports/empresa-repository.port';
import { CambiosEmpresa, EmpresaProps } from '../../domain/props/empresa.props';

export type ActualizarEmpresaInput = {
  empresaId: number;
  cambios: CambiosEmpresa;
};

@Injectable()
export class ActualizarEmpresaUseCase {
  constructor(
    @Inject(EMPRESA_REPOSITORY)
    private readonly empresas: EmpresaRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: ActualizarEmpresaInput): Promise<EmpresaProps> {
    const empresa = await this.empresas.findById(input.empresaId);
    if (!empresa) throw new EmpresaNoConfiguradaError();

    empresa.actualizar(input.cambios, this.reloj.ahora());

    return (await this.empresas.update(empresa)).toPrimitives();
  }
}
