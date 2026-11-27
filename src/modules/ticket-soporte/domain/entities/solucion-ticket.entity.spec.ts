import {
  CatalogoTicketInvalidoError,
  SolucionTicketNoEncontradaError,
} from '../errors/ticket-soporte.errors';
import { SolucionTicketEntity } from './solucion-ticket.entity';

describe('SolucionTicketEntity', () => {
  it('exige nombre y vacía la descripción en blanco', () => {
    expect(() => SolucionTicketEntity.create({ nombre: '' })).toThrow(
      CatalogoTicketInvalidoError,
    );
    expect(
      SolucionTicketEntity.create({
        nombre: 'Redropeo',
        descripcion: '  ',
      }).toPrimitives().descripcion,
    ).toBeNull();
  });

  it('editar solo cambia lo que llega; eliminada no se edita', () => {
    const solucion = SolucionTicketEntity.create({
      nombre: 'Redropeo',
      descripcion: 'Acometida',
    });
    solucion.editar({ nombre: 'Re-dropeo' });
    expect(solucion.toPrimitives().descripcion).toBe('Acometida');

    solucion.eliminar();
    expect(() => solucion.editar({ nombre: 'x' })).toThrow(
      SolucionTicketNoEncontradaError,
    );
  });
});
