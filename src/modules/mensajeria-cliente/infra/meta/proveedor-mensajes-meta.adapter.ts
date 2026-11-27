import { Injectable } from '@nestjs/common';
import {
  MensajePlantilla,
  ProveedorMensajesPort,
} from '../../application/ports/proveedor-mensajes.port';
import { MetaGraphAdapter } from './meta-graph.adapter';

type RespuestaEnvio = { messages?: Array<{ id?: string }> };

@Injectable()
export class ProveedorMensajesMetaAdapter implements ProveedorMensajesPort {
  constructor(private readonly graph: MetaGraphAdapter) {}

  async enviar(
    mensaje: MensajePlantilla,
  ): Promise<{ mensajeId: string | null }> {
    const componentes = [
      ...(mensaje.imagenUrl
        ? [
            {
              type: 'header',
              parameters: [
                { type: 'image', image: { link: mensaje.imagenUrl } },
              ],
            },
          ]
        : []),
      ...(mensaje.variables
        ? [
            {
              type: 'body',
              parameters: mensaje.variables.map((variable) => ({
                type: 'text',
                text: String(variable),
              })),
            },
          ]
        : []),
    ];

    const respuesta = await this.graph.pedir<RespuestaEnvio>(
      'Envío de plantilla',
      `${this.graph.requerido('WHATSAPP_PHONE_ID')}/messages`,
      {
        method: 'POST',
        data: {
          messaging_product: 'whatsapp',
          to: mensaje.telefono,
          type: 'template',
          template: {
            name: mensaje.plantilla,
            language: { code: mensaje.idioma },
            ...(componentes.length > 0 && { components: componentes }),
          },
        },
      },
    );

    return { mensajeId: respuesta?.messages?.[0]?.id ?? null };
  }
}
