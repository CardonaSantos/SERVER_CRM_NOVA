import { Inject, Injectable } from '@nestjs/common';
import { MensajeriaArchivoInvalidoError } from '../../domain/errors/mensajeria-cliente.errors';
import {
  ArchivoImagen,
  PROVEEDOR_PLANTILLAS,
  ProveedorPlantillasPort,
} from '../ports/proveedor-plantillas.port';

/** Límite de WhatsApp para imágenes. */
export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

const TIPOS_ADMITIDOS = ['image/jpeg', 'image/png'];

export type SubirImagenPlantillaResult = {
  handle: string;
  fileName: string;
  mimeType: string;
  size: number;
};

@Injectable()
export class SubirImagenPlantillaUseCase {
  constructor(
    @Inject(PROVEEDOR_PLANTILLAS)
    private readonly proveedor: ProveedorPlantillasPort,
  ) {}

  async execute(
    archivo: ArchivoImagen | null,
  ): Promise<SubirImagenPlantillaResult> {
    if (
      !archivo ||
      !TIPOS_ADMITIDOS.includes(archivo.mimeType) ||
      archivo.tamano > TAMANO_MAXIMO_IMAGEN
    ) {
      throw new MensajeriaArchivoInvalidoError();
    }

    const { handle } = await this.proveedor.subirImagen(archivo);

    return {
      handle,
      fileName: archivo.nombre,
      mimeType: archivo.mimeType,
      size: archivo.tamano,
    };
  }
}
