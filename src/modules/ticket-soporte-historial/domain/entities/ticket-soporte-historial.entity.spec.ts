import { TicketSoporteHistorialDatosInvalidosError } from '../errors/ticket-soporte-historial.errors';
import { TicketSoporteHistorialTipo } from '../enums/ticket-soporte-historial-tipo.enum';
import { TicketSoporteHistorialEntity } from './ticket-soporte-historial.entity';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

const BASE = {
  ticketId: 10,
  usuarioId: 3,
  tipo: TicketSoporteHistorialTipo.CREADO,
  descripcion: '  Ticket creado  ',
  usuarioNombre: ' Ana ',
};

describe('TicketSoporteHistorialEntity', () => {
  it('nace con la fecha recibida y los textos recortados', () => {
    const entrada = TicketSoporteHistorialEntity.create(BASE, AHORA);

    expect(entrada.id).toBeNull();
    expect(entrada.creadoEn).toEqual(AHORA);
    expect(entrada.descripcion).toBe('Ticket creado');
    expect(entrada.usuarioNombre).toBe('Ana');
  });

  it('acepta una entrada del sistema, sin usuario', () => {
    const entrada = TicketSoporteHistorialEntity.create(
      { ...BASE, usuarioId: null, usuarioNombre: '   ' },
      AHORA,
    );

    expect(entrada.usuarioId).toBeNull();
    expect(entrada.usuarioNombre).toBeNull();
  });

  it.each([0, -1, 1.5, Number.NaN])('rechaza el ticket %p', (ticketId) => {
    expect(() =>
      TicketSoporteHistorialEntity.create({ ...BASE, ticketId }, AHORA),
    ).toThrow(TicketSoporteHistorialDatosInvalidosError);
  });

  it.each([0, -3, 2.5])('rechaza el usuario %p', (usuarioId) => {
    expect(() =>
      TicketSoporteHistorialEntity.create({ ...BASE, usuarioId }, AHORA),
    ).toThrow(TicketSoporteHistorialDatosInvalidosError);
  });

  it('devuelve copias de la fecha: no se puede mutar desde fuera', () => {
    const entrada = TicketSoporteHistorialEntity.create(BASE, AHORA);

    entrada.creadoEn.setFullYear(1999);
    entrada.toPrimitives().creadoEn.setFullYear(1999);

    expect(entrada.creadoEn).toEqual(AHORA);
  });

  it('hydrate reconstruye una entrada guardada', () => {
    const entrada = TicketSoporteHistorialEntity.hydrate({
      id: 7,
      ticketId: 10,
      usuarioId: null,
      tipo: TicketSoporteHistorialTipo.CANCELADO,
      descripcion: 'Ticket cancelado',
      usuarioNombre: 'Sistema',
      creadoEn: AHORA,
    });

    expect(entrada.id).toBe(7);
    expect(entrada.tipo).toBe(TicketSoporteHistorialTipo.CANCELADO);
  });
});
