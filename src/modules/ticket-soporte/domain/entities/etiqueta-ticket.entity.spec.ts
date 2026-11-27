import {
  CatalogoTicketInvalidoError,
  EtiquetaTicketNoEncontradaError,
} from '../errors/ticket-soporte.errors';
import { EtiquetaTicketEntity } from './etiqueta-ticket.entity';

const AHORA = new Date('2026-11-27T15:00:00.000Z');

describe('EtiquetaTicketEntity', () => {
  it('exige nombre', () => {
    expect(() => EtiquetaTicketEntity.create(' ')).toThrow(
      CatalogoTicketInvalidoError,
    );
  });

  it('eliminada ya no se edita, y puede recuperarse', () => {
    const etiqueta = EtiquetaTicketEntity.create('Fibra');
    etiqueta.eliminar(9, AHORA);

    expect(() => etiqueta.renombrar('Otra')).toThrow(
      EtiquetaTicketNoEncontradaError,
    );

    etiqueta.restaurar('FIBRA');
    expect(etiqueta.eliminada).toBe(false);
    expect(etiqueta.nombre).toBe('FIBRA');
  });
});
