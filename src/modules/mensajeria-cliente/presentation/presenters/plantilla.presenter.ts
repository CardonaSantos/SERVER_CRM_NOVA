import {
  ComponentePlantilla,
  PaginaPlantillas,
  PlantillaReadModel,
} from '../../domain/read-models/plantilla.read-model';
import {
  ListaPlantillasResponseDto,
  PlantillaResponseDto,
} from '../dto/plantilla-response.dto';

export class PlantillaPresenter {
  static item(p: PlantillaReadModel): PlantillaResponseDto {
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      category: p.category,
      language: p.language,
      components: p.components.map(PlantillaPresenter.componente),
    };
  }

  static listado(pagina: PaginaPlantillas): ListaPlantillasResponseDto {
    return {
      data: pagina.items.map(PlantillaPresenter.item),
      meta: { siguiente: pagina.siguiente },
    };
  }

  private static componente(c: ComponentePlantilla): ComponentePlantilla {
    return {
      type: c.type,
      format: c.format,
      text: c.text,
      example: c.example && {
        body_text: c.example.body_text,
        header_text: c.example.header_text,
        header_handle: c.example.header_handle,
      },
      buttons: c.buttons?.map((b) => ({
        type: b.type,
        text: b.text,
        url: b.url,
        phone_number: b.phone_number,
        example: b.example,
      })),
    };
  }
}
