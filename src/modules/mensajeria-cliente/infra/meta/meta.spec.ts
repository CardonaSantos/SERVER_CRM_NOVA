import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import {
  MensajeriaProveedorNoDisponibleError,
  MensajeriaProveedorRechazoError,
  MensajeriaSinConfirmacionError,
} from '../../domain/errors/mensajeria-cliente.errors';
import { traducirErrorMeta } from './meta-error.mapper';
import { MetaGraphAdapter } from './meta-graph.adapter';
import { ProveedorMensajesMetaAdapter } from './proveedor-mensajes-meta.adapter';

describe('Adaptador de Meta', () => {
  const respuesta = (status: number, error: object = {}) => ({
    response: { status, data: { error } },
  });

  it.each([
    [respuesta(400, { code: 132001 }), MensajeriaProveedorRechazoError],
    [respuesta(401), MensajeriaProveedorNoDisponibleError],
    [respuesta(429), MensajeriaProveedorNoDisponibleError],
    [respuesta(400, { code: 190 }), MensajeriaProveedorNoDisponibleError],
    [respuesta(503), MensajeriaSinConfirmacionError],
    [{ code: 'ECONNREFUSED' }, MensajeriaProveedorNoDisponibleError],
    [{ code: 'ECONNABORTED' }, MensajeriaSinConfirmacionError],
  ])('clasifica %p', (fallo, esperado) => {
    expect(traducirErrorMeta(fallo)).toBeInstanceOf(esperado);
  });

  it('muestra el texto de Meta para el usuario, nunca el técnico', () => {
    const error = {
      code: 100,
      message: '(#100) detalle interno',
      error_user_msg: 'Ya existe una plantilla con ese nombre.',
    };

    expect(traducirErrorMeta(respuesta(400, error)).message).toBe(
      'Ya existe una plantilla con ese nombre.',
    );
    expect(traducirErrorMeta(respuesta(400, { code: 100 })).message).toBe(
      'WhatsApp rechazó la solicitud (código 100).',
    );
  });

  const adaptador = (entorno: Record<string, string>) => {
    const peticiones: any[] = [];
    const http = {
      request: (peticion: unknown) => {
        peticiones.push(peticion);
        return of({ data: { messages: [{ id: 'wamid' }] } });
      },
    } as unknown as HttpService;
    const config = {
      get: (nombre: string) => entorno[nombre],
    } as unknown as ConfigService;

    return {
      peticiones,
      mensajes: new ProveedorMensajesMetaAdapter(
        new MetaGraphAdapter(config, http),
      ),
    };
  };

  it('envía el mismo cuerpo que se enviaba antes', async () => {
    const { mensajes, peticiones } = adaptador({
      WHATSAPP_PHONE_ID: '10',
      WHATSAPP_API_TOKEN: 'ficticio',
    });

    await mensajes.enviar({
      telefono: '50250000001',
      plantilla: 'ticket',
      idioma: 'es',
      variables: ['Ana'],
    });

    expect(peticiones[0]).toMatchObject({
      method: 'POST',
      url: 'https://graph.facebook.com/v21.0/10/messages',
      data: {
        messaging_product: 'whatsapp',
        to: '50250000001',
        type: 'template',
        template: {
          name: 'ticket',
          language: { code: 'es' },
          components: [
            { type: 'body', parameters: [{ type: 'text', text: 'Ana' }] },
          ],
        },
      },
    });
  });

  it('sin configuración no llama a Meta', async () => {
    const { mensajes, peticiones } = adaptador({});

    await expect(
      mensajes.enviar({ telefono: '1', plantilla: 'x', idioma: 'es' }),
    ).rejects.toThrow(MensajeriaProveedorNoDisponibleError);
    expect(peticiones).toHaveLength(0);
  });
});
