import { PlantillaLegal } from '../entities/plantilla-legal.entity';
import { TipoPlantillaLegal } from '@prisma/client';

export const PLANTILLA_LEGAL_REPOSITORY = Symbol('PLANTILLA_LEGAL_REPOSITORY');

export interface PlantillaLegalRepository {
  create(plantilla: PlantillaLegal): Promise<PlantillaLegal>;

  findById(id: number): Promise<PlantillaLegal>;

  findMany(params?: {
    tipo?: TipoPlantillaLegal;
    soloActivas?: boolean;
  }): Promise<Array<PlantillaLegal>>;

  update(plantilla: PlantillaLegal): Promise<PlantillaLegal>;

  activar(id: number): Promise<void>;

  desactivar(id: number): Promise<void>;

  getPlantillasToComprobante(
    creditoId: number,
    plantillaId: number,
  ): Promise<{
    plantillaId: number;
    creditoId: number;
    html: string;
  }>;
}
