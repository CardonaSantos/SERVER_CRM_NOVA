import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  ContratoInstalacionNoEncontradaError,
  PlantillaContratoNoEncontradaError,
} from '../../domain/errors/contrato-cliente.errors';
import { armarDocumentoContrato } from '../../domain/policies/documento-contrato.policy';
import {
  DOCUMENTO_CONTRATO_QUERY,
  DocumentoContratoQueryPort,
} from '../../domain/ports/documento-contrato-query.port';
import {
  PLANTILLA_CONTRATO_REPOSITORY,
  PlantillaContratoRepositoryPort,
} from '../../domain/ports/plantilla-contrato-repository.port';
import { DocumentoContratoReadModel } from '../../domain/read-models/documento-contrato.read-model';

export type ObtenerDocumentoContratoInput = {
  instalacionId: number;
  plantillaId: number;
};

@Injectable()
export class ObtenerDocumentoContratoUseCase {
  constructor(
    @Inject(DOCUMENTO_CONTRATO_QUERY)
    private readonly documentos: DocumentoContratoQueryPort,
    @Inject(PLANTILLA_CONTRATO_REPOSITORY)
    private readonly plantillas: PlantillaContratoRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: ObtenerDocumentoContratoInput,
  ): Promise<DocumentoContratoReadModel> {
    const datos = await this.documentos.findDatos(input.instalacionId);
    if (!datos) throw new ContratoInstalacionNoEncontradaError();

    const plantilla = await this.plantillas.findById(input.plantillaId);
    if (!plantilla) throw new PlantillaContratoNoEncontradaError();

    const { id, nombre, body } = plantilla.toPrimitives();

    return armarDocumentoContrato(
      datos,
      { id: id!, nombre, body },
      this.reloj.ahora(),
    );
  }
}
