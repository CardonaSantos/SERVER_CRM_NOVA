import { Injectable } from '@nestjs/common';
import {
  ArchivoImagen,
  NuevaPlantilla,
  PlantillaCreada,
  ProveedorPlantillasPort,
} from '../../application/ports/proveedor-plantillas.port';
import {
  PaginaPlantillas,
  PlantillaFiltros,
  PlantillaReadModel,
} from '../../domain/read-models/plantilla.read-model';
import { MetaGraphAdapter } from './meta-graph.adapter';

type ListaMeta = {
  data?: PlantillaReadModel[];
  paging?: { cursors?: { after?: string }; next?: string };
};

@Injectable()
export class ProveedorPlantillasMetaAdapter implements ProveedorPlantillasPort {
  constructor(private readonly graph: MetaGraphAdapter) {}

  private get ruta(): string {
    return `${this.graph.requerido('WHATSAPP_WABA_ID')}/message_templates`;
  }

  async listar(filtros: PlantillaFiltros): Promise<PaginaPlantillas> {
    const lista = await this.graph.pedir<ListaMeta>(
      'Listado de plantillas',
      this.ruta,
      {
        method: 'GET',
        params: {
          fields: 'id,name,status,category,language,components',
          ...filtros,
          limit: filtros.limit ?? 100,
        },
      },
    );

    return {
      items: (lista.data ?? []).map((p) => ({
        ...p,
        components: p.components ?? [],
      })),
      siguiente: lista.paging?.next
        ? (lista.paging.cursors?.after ?? null)
        : null,
    };
  }

  async crear(plantilla: NuevaPlantilla): Promise<PlantillaCreada> {
    const creada = await this.graph.pedir<{
      id: string;
      status: string;
      category?: string;
    }>('Creación de plantilla', this.ruta, {
      method: 'POST',
      data: plantilla,
    });

    return {
      id: creada.id,
      status: creada.status,
      category: creada.category ?? null,
    };
  }

  async eliminar(nombre: string): Promise<void> {
    await this.graph.pedir('Eliminación de plantilla', this.ruta, {
      method: 'DELETE',
      params: { name: nombre },
    });
  }

  /** WhatsApp pide abrir una sesión de subida y luego mandar el binario. */
  async subirImagen(archivo: ArchivoImagen): Promise<{ handle: string }> {
    const sesion = await this.graph.pedir<{ id: string }>(
      'Sesión de subida',
      `${this.graph.requerido('META_APP_ID')}/uploads`,
      {
        method: 'POST',
        params: {
          file_name: archivo.nombre,
          file_length: archivo.tamano,
          file_type: archivo.mimeType,
        },
      },
    );
    const subida = await this.graph.pedir<{ h: string }>(
      'Subida de imagen',
      sesion.id,
      {
        method: 'POST',
        data: archivo.contenido,
        headers: { file_offset: '0', 'Content-Type': archivo.mimeType },
        maxBodyLength: Infinity,
      },
      'OAuth',
    );

    return { handle: subida.h };
  }
}
