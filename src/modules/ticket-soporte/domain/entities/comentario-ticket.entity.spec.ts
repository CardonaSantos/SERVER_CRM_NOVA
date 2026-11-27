import {
  ComentarioAjenoError,
  ComentarioInvalidoError,
  ComentarioNoEncontradoError,
} from '../errors/ticket-soporte.errors';
import { ComentarioTicketEntity } from './comentario-ticket.entity';

const AHORA = new Date('2026-11-27T15:00:00.000Z');

const crear = (texto: string | undefined, totalImagenes = 0) =>
  ComentarioTicketEntity.create(
    { ticketId: 1, usuarioId: 1, texto, totalImagenes },
    AHORA,
  );

describe('ComentarioTicketEntity', () => {
  it('admite solo texto o solo imágenes, nunca nada', () => {
    expect(crear('  listo ').toPrimitives().texto).toBe('listo');
    expect(crear(undefined, 2).toPrimitives().texto).toBe('');
    expect(() => crear('   ')).toThrow(ComentarioInvalidoError);
  });

  it('el autor borra el suyo y queda quién y cuándo', () => {
    const comentario = crear('hola');
    comentario.eliminar(1, false, AHORA);

    expect(comentario.toPrimitives()).toMatchObject({
      eliminadoPorId: 1,
      eliminadoEn: AHORA,
      texto: 'hola',
    });
  });

  it('nadie más lo borra, salvo la oficina', () => {
    expect(() => crear('hola').eliminar(2, false, AHORA)).toThrow(
      ComentarioAjenoError,
    );
    expect(() => crear('hola').eliminar(2, true, AHORA)).not.toThrow();
  });

  it('no se borra dos veces', () => {
    const comentario = crear('hola');
    comentario.eliminar(1, false, AHORA);

    expect(() => comentario.eliminar(1, true, AHORA)).toThrow(
      ComentarioNoEncontradoError,
    );
  });

  it('un comentario eliminado no se edita', () => {
    const comentario = crear('hola');
    comentario.eliminar(1, false, AHORA);

    expect(() => comentario.editar('otro', 1, AHORA)).toThrow(
      ComentarioNoEncontradoError,
    );
  });
});
