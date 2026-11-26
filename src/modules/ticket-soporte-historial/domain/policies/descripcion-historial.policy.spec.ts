import { TicketSoporteHistorialTipo } from '../enums/ticket-soporte-historial-tipo.enum';
import { TicketHistorialCambio } from '../props/ticket-historial-cambio.props';
import {
  construirDescripcionHistorial,
  hayCambioReal,
  inferirTipoActualizacion,
  soloCambiosReales,
} from './descripcion-historial.policy';

const cambio = (
  campo: TicketHistorialCambio['campo'],
  anterior: TicketHistorialCambio['anterior'],
  nuevo: TicketHistorialCambio['nuevo'],
): TicketHistorialCambio => ({ campo, anterior, nuevo });

describe('descripcion-historial.policy', () => {
  describe('hayCambioReal', () => {
    it('igual no es cambio, distinto sí', () => {
      expect(hayCambioReal(cambio('titulo', 'a', 'a'))).toBe(false);
      expect(hayCambioReal(cambio('titulo', 'a', 'b'))).toBe(true);
      expect(hayCambioReal(cambio('titulo', null, 'b'))).toBe(true);
    });

    it('las listas se comparan sin importar el orden', () => {
      expect(hayCambioReal(cambio('etiquetas', [1, 2], [2, 1]))).toBe(false);
      expect(hayCambioReal(cambio('etiquetas', [1, 2], [1, 3]))).toBe(true);
    });
  });

  describe('inferirTipoActualizacion', () => {
    it.each<[string, TicketHistorialCambio[], TicketSoporteHistorialTipo]>([
      [
        'estado a CANCELADA',
        [cambio('estado', 'ABIERTA', 'CANCELADA')],
        TicketSoporteHistorialTipo.CANCELADO,
      ],
      [
        'estado sale de CANCELADA',
        [cambio('estado', 'CANCELADA', 'ABIERTA')],
        TicketSoporteHistorialTipo.REABIERTO,
      ],
      [
        'solo estado',
        [cambio('estado', 'ABIERTA', 'EN_PROCESO')],
        TicketSoporteHistorialTipo.ESTADO_CAMBIADO,
      ],
      [
        'solo prioridad',
        [cambio('prioridad', 'BAJA', 'ALTA')],
        TicketSoporteHistorialTipo.PRIORIDAD_CAMBIADA,
      ],
      [
        'solo técnicos',
        [
          cambio('tecnicoPrincipal', 1, 2),
          cambio('tecnicosAdicionales', [], [3]),
        ],
        TicketSoporteHistorialTipo.ASIGNACION_CAMBIADA,
      ],
      [
        'fijar',
        [cambio('fijado', false, true)],
        TicketSoporteHistorialTipo.FIJADO,
      ],
      [
        'desfijar',
        [cambio('fijado', true, false)],
        TicketSoporteHistorialTipo.DESFIJADO,
      ],
      [
        'estado junto con otros cambios',
        [cambio('estado', 'ABIERTA', 'EN_PROCESO'), cambio('titulo', 'a', 'b')],
        TicketSoporteHistorialTipo.ACTUALIZADO,
      ],
      [
        'varios campos mezclados',
        [cambio('titulo', 'a', 'b'), cambio('prioridad', 'BAJA', 'ALTA')],
        TicketSoporteHistorialTipo.ACTUALIZADO,
      ],
    ])('%s', (_nombre, cambios, esperado) => {
      expect(inferirTipoActualizacion(cambios)).toBe(esperado);
    });
  });

  describe('construirDescripcionHistorial', () => {
    it('sin cambios devuelve la base', () => {
      expect(construirDescripcionHistorial('Ticket creado', [])).toBe(
        'Ticket creado',
      );
    });

    it('una base vacía usa el texto genérico', () => {
      expect(construirDescripcionHistorial('  ', [])).toBe(
        'Cambio registrado en ticket',
      );
    });

    it('añade el detalle de los cambios reales con su etiqueta', () => {
      const texto = construirDescripcionHistorial('Ticket actualizado', [
        cambio('estado', 'ABIERTA', 'EN_PROCESO'),
        cambio('titulo', 'igual', 'igual'),
        cambio('fijado', false, true),
        { ...cambio('otro', null, 'x'), etiqueta: 'Dato' },
      ]);

      expect(texto).toBe(
        'Ticket actualizado · Estado: ABIERTA → EN_PROCESO · Fijado: No → Sí · Dato: — → x',
      );
    });

    it('formatea listas y recorta textos largos', () => {
      const largo = 'x'.repeat(200);
      const texto = construirDescripcionHistorial('Base', [
        cambio('tecnicosAdicionales', [], [1, 2]),
        cambio('descripcion', null, largo),
      ]);

      expect(texto).toContain('Técnicos adicionales: [] → [1, 2]');
      expect(texto).toContain(`${'x'.repeat(157)}...`);
      expect(texto).not.toContain('x'.repeat(158));
    });
  });

  it('soloCambiosReales descarta los que no cambian', () => {
    expect(
      soloCambiosReales([
        cambio('titulo', 'a', 'a'),
        cambio('titulo', 'a', 'b'),
      ]),
    ).toHaveLength(1);
  });
});
