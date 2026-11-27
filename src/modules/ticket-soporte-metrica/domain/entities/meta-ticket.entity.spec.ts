import {
  MetaTicketCanceladaError,
  MetaTicketInvalidaError,
} from '../errors/ticket-soporte-metrica.errors';
import { MetaTicketEntity } from './meta-ticket.entity';

const AHORA = new Date('2026-07-01T12:00:00.000Z');
const base = {
  tecnicoId: 1,
  fechaInicio: '2026-07-01',
  fechaFin: '2026-07-31',
  objetivo: 20,
};

describe('MetaTicketEntity', () => {
  it('nace vigente, con el título limpio', () => {
    const meta = MetaTicketEntity.create(
      { ...base, titulo: '  Julio ' },
      AHORA,
    );

    expect(meta.toPrimitives()).toMatchObject({
      id: null,
      titulo: 'Julio',
      cancelada: false,
      fechaFin: '2026-07-31',
    });
  });

  it('acepta una meta de un solo día', () => {
    expect(() =>
      MetaTicketEntity.create({ ...base, fechaFin: base.fechaInicio }, AHORA),
    ).not.toThrow();
  });

  it.each([
    { fechaFin: '2026-06-30' },
    { fechaFin: '2026-02-30' },
    { objetivo: 0 },
    { objetivo: -3 },
    { objetivo: 1.5 },
    { titulo: 'x'.repeat(151) },
  ])('rechaza %o', (cambio) => {
    expect(() =>
      MetaTicketEntity.create({ ...base, ...cambio }, AHORA),
    ).toThrow(MetaTicketInvalidaError);
  });

  it('editar solo cambia lo que llega y null quita el título', () => {
    const meta = MetaTicketEntity.create({ ...base, titulo: 'Julio' }, AHORA);

    meta.editar({ objetivo: 25 }, AHORA);
    expect(meta.toPrimitives()).toMatchObject({
      titulo: 'Julio',
      objetivo: 25,
      fechaInicio: '2026-07-01',
      fechaFin: '2026-07-31',
    });

    meta.editar({ titulo: null }, AHORA);
    expect(meta.toPrimitives().titulo).toBeNull();
  });

  it('una edición inválida no deja la meta a medias', () => {
    const meta = MetaTicketEntity.create(base, AHORA);

    expect(() =>
      meta.editar({ objetivo: 30, fechaFin: '2026-06-01' }, AHORA),
    ).toThrow(MetaTicketInvalidaError);
    expect(meta.toPrimitives()).toMatchObject({ objetivo: 20 });
  });

  it('una meta cancelada no se edita ni se vuelve a cancelar', () => {
    const meta = MetaTicketEntity.create(base, AHORA);
    meta.cancelar(AHORA);

    expect(() => meta.editar({ objetivo: 2 }, AHORA)).toThrow(
      MetaTicketCanceladaError,
    );
    expect(() => meta.cancelar(AHORA)).toThrow(MetaTicketCanceladaError);
  });
});
