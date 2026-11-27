import { ComponentePlantilla } from '../../domain/read-models/plantilla.read-model';

export class PlantillaResponseDto {
  /** Id en WhatsApp */ id: string;
  /** Nombre */ name: string;
  /** Estado de revisión */ status: string;
  /** Categoría */ category: string;
  /** Idioma */ language: string;
  /** Partes de la plantilla */ components: ComponentePlantilla[];
}

export class ListaPlantillasResponseDto {
  /** Plantillas */ data: PlantillaResponseDto[];
  /** `siguiente`: cursor de la otra página */ meta: {
    siguiente: string | null;
  };
}
