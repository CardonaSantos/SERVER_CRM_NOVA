import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import { CategoriaNotificacion } from '../../domain/enums/categoria-notificacion.enum';
import {
  NotificacionesEnMemoria,
  NotificacionEventosFake,
} from '../../test/fakes/notificacion.fake';
import { LimpiarNotificacionesUseCase } from './limpiar-notificaciones.use-case';
import { NotificarUseCase } from './notificar.use-case';

describe('LimpiarNotificacionesUseCase', () => {
  it('borra las de hace más de 90 días y sus filas de bandeja; conserva las demás', async () => {
    const reloj = new RelojFijo('2027-03-06T09:00:00.000Z');
    const db = new NotificacionesEnMemoria();
    db.usuarios = new Map([
      [1, 'ROL_A'],
      [2, 'ROL_A'],
    ]);
    const notificar = new NotificarUseCase(
      db,
      db,
      new NotificacionEventosFake(),
      reloj,
    );
    const crear = () =>
      notificar.execute({
        mensaje: 'Zona procesada',
        categoria: CategoriaNotificacion.FACTURACION,
        destino: { roles: ['ROL_A'] },
      });

    reloj.establecer('2026-12-06T08:59:00.000Z'); // 90 días y 1 minuto antes
    await crear();
    reloj.establecer('2026-12-06T09:00:00.000Z'); // justo 90 días antes
    await crear();
    reloj.establecer('2027-03-06T09:00:00.000Z');
    await crear();

    const r = await new LimpiarNotificacionesUseCase(db, reloj).execute();

    expect(r).toEqual({ borradas: 1 });
    expect([...db.notificaciones.keys()]).toEqual([2, 3]);
    expect(db.filas.map((f) => f.notificacionId)).toEqual([2, 2, 3, 3]);
  });
});
