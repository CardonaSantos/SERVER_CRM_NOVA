import {
  MensajeriaPlantillaInvalidaError,
  MensajeriaPlantillaNoEnviableError,
} from '../errors/mensajeria-cliente.errors';
import { plantillaAprobada } from '../../test/fakes/mensajeria-cliente.fake';
import { resolverDestinos } from './destinatarios.policy';
import {
  asegurarEnviableEnCampania,
  asegurarNombrePlantilla,
  sanearComponentes,
} from './plantilla.policy';
import { normalizarTelefonos } from './telefono.policy';

describe('Teléfonos para WhatsApp', () => {
  it('separa por coma, antepone 502 y descarta lo corto, sin quitar repetidos', () => {
    expect(
      normalizarTelefonos([
        '5000-0001, +502 5000 0001',
        '123',
        null,
        undefined,
      ]),
    ).toEqual(['50250000001', '50250000001']);
  });

  it('en campañas un cliente recibe en cada número suyo una sola vez', () => {
    const destinos = resolverDestinos([
      {
        id: 1,
        telefono: '50000001,50000002,50000001',
        eliminado: false,
        whatsappActivo: true,
      },
      // Dos números pegados: demasiado largo.
      {
        id: 2,
        telefono: '5000000150000002',
        eliminado: false,
        whatsappActivo: true,
      },
    ]);

    expect(destinos.map((d) => [d.clienteId, d.telefono, d.estado])).toEqual([
      [1, '50250000001', 'PENDIENTE'],
      [1, '50250000002', 'PENDIENTE'],
      [2, null, 'OMITIDO'],
    ]);
  });
});

describe('Plantillas', () => {
  it.each(['Aviso', 'con espacio', '../otro', ''])(
    'rechaza el nombre %p',
    (nombre) => {
      expect(() => asegurarNombrePlantilla(nombre)).toThrow(
        MensajeriaPlantillaInvalidaError,
      );
    },
  );

  it('quita el ejemplo de un cuerpo sin variables y lo exige con ellas', () => {
    expect(
      sanearComponentes([
        { type: 'BODY', text: 'Hola', example: { body_text: [[]] } },
      ]),
    ).toEqual([{ type: 'BODY', text: 'Hola' }]);
    expect(() =>
      sanearComponentes([
        { type: 'BODY', text: 'Hola {{1}}', example: { body_text: [['']] } },
      ]),
    ).toThrow(MensajeriaPlantillaInvalidaError);
  });

  const conImagen = plantillaAprobada({
    components: [{ type: 'HEADER', format: 'IMAGE' }, { type: 'BODY' }],
  });

  it('acepta en campañas las aprobadas sin variables', () => {
    expect(() =>
      asegurarEnviableEnCampania(plantillaAprobada(), null),
    ).not.toThrow();
    expect(() =>
      asegurarEnviableEnCampania(conImagen, 'https://x.test/a.png'),
    ).not.toThrow();
  });

  it.each([
    ['sin aprobar', plantillaAprobada({ status: 'PENDING' }), null],
    [
      'de autenticación',
      plantillaAprobada({ category: 'AUTHENTICATION' }),
      null,
    ],
    [
      'con variables',
      plantillaAprobada({
        components: [{ type: 'BODY', text: 'Hola {{1}}' }],
      }),
      null,
    ],
    [
      'con variable en un botón',
      plantillaAprobada({
        components: [
          {
            type: 'BUTTONS',
            buttons: [{ type: 'URL', text: 'Ver', url: 'https://x/{{1}}' }],
          },
        ],
      }),
      null,
    ],
    [
      'con video',
      plantillaAprobada({
        components: [{ type: 'HEADER', format: 'VIDEO' }],
      }),
      null,
    ],
    ['que pide imagen y no la trae', conImagen, null],
    ['sin imagen que recibe una', plantillaAprobada(), 'https://x.test/a.png'],
  ])('rechaza una plantilla %s', (_caso, plantilla, imagen) => {
    expect(() => asegurarEnviableEnCampania(plantilla, imagen)).toThrow(
      MensajeriaPlantillaNoEnviableError,
    );
  });
});
