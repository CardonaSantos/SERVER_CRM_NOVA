import { Inject, Injectable } from '@nestjs/common';
import {
  PROVEEDOR_MENSAJES,
  ProveedorMensajesPort,
} from '../ports/proveedor-mensajes.port';

/** Idioma de las plantillas de avisos y tickets. */
const IDIOMA_AVISOS = 'es';

export type EnviarPlantillaInput = {
  telefono: string;
  plantilla: string;
  variables: string[];
};

/** Un aviso suelto (factura, ticket) a un teléfono ya normalizado. */
@Injectable()
export class EnviarPlantillaUseCase {
  constructor(
    @Inject(PROVEEDOR_MENSAJES)
    private readonly proveedor: ProveedorMensajesPort,
  ) {}

  execute(input: EnviarPlantillaInput): Promise<{ mensajeId: string | null }> {
    return this.proveedor.enviar({ ...input, idioma: IDIOMA_AVISOS });
  }
}
