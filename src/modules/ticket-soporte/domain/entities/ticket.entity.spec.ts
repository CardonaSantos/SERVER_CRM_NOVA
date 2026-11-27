import { EstadoTicket } from '../enums/estado-ticket.enum';
import { FaseTicket } from '../enums/fase-ticket.enum';
import {
  TicketInvalidoError,
  TicketSinTecnicoError,
} from '../errors/ticket-soporte.errors';
import { TicketEntity } from './ticket.entity';

const AHORA = new Date('2026-11-27T15:00:00.000Z');
const LUEGO = new Date('2026-11-27T17:00:00.000Z');

const crear = (extra: object = {}) =>
  TicketEntity.create({ empresaId: 1, titulo: ' Sin señal ', ...extra }, AHORA);

describe('TicketEntity', () => {
  it('nace abierto, sin repetir al principal entre los apoyos', () => {
    const datos = crear({
      tecnicoId: 1,
      apoyoIds: [1, 2, 2],
    }).toPrimitives();

    expect(datos.estado).toBe(EstadoTicket.ABIERTA);
    expect(datos.titulo).toBe('Sin señal');
    expect(datos.apoyoIds).toEqual([2]);
    expect(datos.fechaAsignacion).toEqual(AHORA);
  });

  it('sin técnicos no tiene fecha de asignación', () => {
    expect(crear().toPrimitives().fechaAsignacion).toBeNull();
  });

  it('exige título', () => {
    expect(() => crear({ titulo: '   ' })).toThrow(TicketInvalidoError);
  });

  it('no se inicia sin nadie asignado', () => {
    expect(() => crear().iniciar(AHORA)).toThrow(TicketSinTecnicoError);
  });

  it('conserva la primera fecha de atención', () => {
    const ticket = crear({ tecnicoId: 1 });
    ticket.iniciar(AHORA);
    ticket.devolver(LUEGO);
    ticket.iniciar(LUEGO);

    expect(ticket.toPrimitives().fechaInicioAtencion).toEqual(AHORA);
  });

  it('al resolver sin trabajo registrado no inventa la fecha técnica', () => {
    const ticket = crear({ fijado: true });
    ticket.resolver(false, LUEGO);

    expect(ticket.toPrimitives()).toMatchObject({
      estado: EstadoTicket.RESUELTA,
      fechaCierre: LUEGO,
      fechaResolucionTecnico: null,
      fijado: false,
    });
  });

  it('cancelar guarda quién y por qué', () => {
    const ticket = crear();
    ticket.cancelar(' Duplicado ', 9, LUEGO);

    expect(ticket.toPrimitives()).toMatchObject({
      estado: EstadoTicket.CANCELADA,
      motivoCancelacion: 'Duplicado',
      canceladoPorId: 9,
      canceladoEn: LUEGO,
    });
    expect(() => crear().cancelar('  ', 9, LUEGO)).toThrow(TicketInvalidoError);
  });

  it('reabrir limpia el cierre y la cancelación', () => {
    const ticket = crear();
    ticket.cancelar('Duplicado', 9, AHORA);
    ticket.reabrir(LUEGO);

    expect(ticket.fase).toBe(FaseTicket.ABIERTA);
    expect(ticket.toPrimitives()).toMatchObject({
      fechaCierre: null,
      canceladoEn: null,
      motivoCancelacion: null,
    });
  });

  it('editar solo cambia lo que llega', () => {
    const ticket = crear({
      tecnicoId: 1,
      apoyoIds: [2],
      descripcion: 'Casa azul',
    });
    ticket.editar({ tecnicoId: 2 }, LUEGO);

    expect(ticket.toPrimitives()).toMatchObject({
      titulo: 'Sin señal',
      descripcion: 'Casa azul',
      tecnicoId: 2,
      apoyoIds: [],
    });
  });

  it('no deja sin técnicos un ticket en proceso', () => {
    const ticket = crear({ tecnicoId: 1 });
    ticket.iniciar(AHORA);

    expect(() => ticket.editar({ tecnicoId: null }, LUEGO)).toThrow(
      TicketSinTecnicoError,
    );
    expect(ticket.tecnicoId).toBe(1);
  });
});
