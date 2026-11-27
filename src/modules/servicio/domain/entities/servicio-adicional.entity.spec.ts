import { EstadoServicio } from '../enums/estado-servicio.enum';
import {
  ServicioAdicionalEliminadoError,
  ServicioAdicionalInvalidoError,
} from '../errors/servicio.errors';
import { ServicioAdicionalEntity } from './servicio-adicional.entity';

const AHORA = new Date('2026-11-26T18:00:00.000Z');

describe('ServicioAdicionalEntity', () => {
  const crear = () =>
    ServicioAdicionalEntity.create(
      {
        empresaId: 1,
        nombre: 'IP fija',
        descripcion: '  ',
        precio: 25,
        tipoServicioId: 2,
      },
      AHORA,
    );

  it('nace activo y una descripción vacía no se guarda', () => {
    expect(crear().toPrimitives()).toMatchObject({
      descripcion: null,
      tipoServicioId: 2,
      estado: EstadoServicio.ACTIVO,
    });
  });

  it('lo que no llega no cambia y null quita el tipo', () => {
    const servicio = crear();
    servicio.actualizar({ tipoServicioId: null }, AHORA);

    expect(servicio.toPrimitives()).toMatchObject({
      nombre: 'IP fija',
      precio: 25,
      tipoServicioId: null,
    });
    expect(() => servicio.actualizar({ precio: -1 }, AHORA)).toThrow(
      ServicioAdicionalInvalidoError,
    );
  });

  it('eliminado queda inactivo y ya no admite cambios', () => {
    const servicio = crear();
    servicio.eliminar(4, AHORA);

    expect(servicio.activo).toBe(false);
    expect(() => servicio.actualizar({}, AHORA)).toThrow(
      ServicioAdicionalEliminadoError,
    );
  });
});
