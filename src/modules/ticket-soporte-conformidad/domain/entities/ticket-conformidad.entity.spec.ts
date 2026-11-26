import { TicketConformidadResultado } from '../enums/ticket-conformidad-resultado.enum';
import {
  TicketConformidadDatosInvalidosError,
  TicketConformidadEstadoInvalidoError,
} from '../errors/ticket-soporte-conformidad.errors';
import { TicketConformidadEntity } from './ticket-conformidad.entity';

const AHORA = new Date('2026-11-25T15:00:00.000Z');
const DESPUES = new Date('2026-11-25T15:30:00.000Z');

const nueva = () =>
  TicketConformidadEntity.create(
    { ticketId: 10, clienteId: 5, tecnicoAsignadoId: 7, creadoPorId: 3 },
    AHORA,
  );

describe('TicketConformidadEntity', () => {
  describe('create', () => {
    it('nace PENDIENTE, sin respuesta y con la fecha recibida', () => {
      const conformidad = nueva();

      expect(conformidad.id).toBeNull();
      expect(conformidad.resultado).toBe(TicketConformidadResultado.PENDIENTE);
      expect(conformidad.estaPendiente()).toBe(true);
      expect(conformidad.creadoEn).toEqual(AHORA);
      expect(conformidad.actualizadoEn).toEqual(AHORA);
      expect(conformidad.respondidoEn).toBeNull();
    });

    it('cliente, técnico y creador son opcionales', () => {
      const conformidad = TicketConformidadEntity.create(
        { ticketId: 10 },
        AHORA,
      );

      expect(conformidad.clienteId).toBeNull();
      expect(conformidad.tecnicoAsignadoId).toBeNull();
      expect(conformidad.creadoPorId).toBeNull();
    });

    it.each([0, -1, 2.5, Number.NaN])('rechaza el ticket %p', (ticketId) => {
      expect(() => TicketConformidadEntity.create({ ticketId }, AHORA)).toThrow(
        TicketConformidadDatosInvalidosError,
      );
    });

    it('rechaza ids opcionales inválidos y fechas inválidas', () => {
      expect(() =>
        TicketConformidadEntity.create({ ticketId: 1, clienteId: 0 }, AHORA),
      ).toThrow(TicketConformidadDatosInvalidosError);
      expect(() =>
        TicketConformidadEntity.create({ ticketId: 1 }, new Date('x')),
      ).toThrow(TicketConformidadDatosInvalidosError);
    });
  });

  describe('transiciones', () => {
    it('marcarConforme responde con la fecha dada', () => {
      const conformidad = nueva();

      conformidad.marcarConforme(DESPUES);

      expect(conformidad.estaConforme()).toBe(true);
      expect(conformidad.respondidoEn).toEqual(DESPUES);
      expect(conformidad.actualizadoEn).toEqual(DESPUES);
      expect(conformidad.creadoEn).toEqual(AHORA);
    });

    it('requerirRetrabajo responde con la fecha dada', () => {
      const conformidad = nueva();

      conformidad.requerirRetrabajo(DESPUES);

      expect(conformidad.requiereRetrabajo()).toBe(true);
      expect(conformidad.respondidoEn).toEqual(DESPUES);
    });

    it('una conformidad respondida no se vuelve a responder', () => {
      const conformidad = nueva();
      conformidad.marcarConforme(DESPUES);

      expect(() => conformidad.requerirRetrabajo(DESPUES)).toThrow(
        TicketConformidadEstadoInvalidoError,
      );
      expect(() => conformidad.marcarConforme(DESPUES)).toThrow(
        TicketConformidadEstadoInvalidoError,
      );
      expect(conformidad.estaConforme()).toBe(true);
    });

    it('rechaza una fecha inválida sin cambiar el estado', () => {
      const conformidad = nueva();

      expect(() => conformidad.marcarConforme(new Date('x'))).toThrow(
        TicketConformidadDatosInvalidosError,
      );
      expect(conformidad.estaPendiente()).toBe(true);
    });
  });

  describe('hydrate', () => {
    const base = {
      id: 1,
      ticketId: 10,
      clienteId: 5,
      tecnicoAsignadoId: 7,
      creadoPorId: 3,
      creadoEn: AHORA,
      actualizadoEn: AHORA,
    };

    it('reconstruye una conformidad respondida', () => {
      const conformidad = TicketConformidadEntity.hydrate({
        ...base,
        resultado: TicketConformidadResultado.CONFORME,
        respondidoEn: DESPUES,
      });

      expect(conformidad.estaConforme()).toBe(true);
      expect(conformidad.respondidoEn).toEqual(DESPUES);
    });

    it('rechaza una pendiente con respuesta y una respondida sin ella', () => {
      expect(() =>
        TicketConformidadEntity.hydrate({
          ...base,
          resultado: TicketConformidadResultado.PENDIENTE,
          respondidoEn: DESPUES,
        }),
      ).toThrow(TicketConformidadDatosInvalidosError);
      expect(() =>
        TicketConformidadEntity.hydrate({
          ...base,
          resultado: TicketConformidadResultado.REQUIERE_RETRABAJO,
          respondidoEn: null,
        }),
      ).toThrow(TicketConformidadDatosInvalidosError);
    });

    it('exige id persistido', () => {
      expect(() =>
        TicketConformidadEntity.hydrate({
          ...base,
          id: null,
          resultado: TicketConformidadResultado.PENDIENTE,
          respondidoEn: null,
        }),
      ).toThrow(TicketConformidadDatosInvalidosError);
    });
  });

  it('devuelve copias de las fechas', () => {
    const conformidad = nueva();

    conformidad.creadoEn.setFullYear(1999);
    conformidad.toPrimitives().creadoEn.setFullYear(1999);

    expect(conformidad.creadoEn).toEqual(AHORA);
  });
});
