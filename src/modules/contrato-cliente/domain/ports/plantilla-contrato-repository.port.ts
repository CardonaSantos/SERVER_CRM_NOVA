import { PlantillaContratoEntity } from '../entities/plantilla-contrato.entity';

export const PLANTILLA_CONTRATO_REPOSITORY = Symbol(
  'PLANTILLA_CONTRATO_REPOSITORY',
);

export interface PlantillaContratoRepositoryPort {
  create(plantilla: PlantillaContratoEntity): Promise<PlantillaContratoEntity>;
  /** @throws PlantillaContratoNoEncontradaError si ya no existe. */
  update(plantilla: PlantillaContratoEntity): Promise<PlantillaContratoEntity>;
  findById(id: number): Promise<PlantillaContratoEntity | null>;
  /** Borra la plantilla; `false` si no existía. */
  delete(id: number): Promise<boolean>;
}
