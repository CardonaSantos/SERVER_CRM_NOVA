import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import { CategoriaNotificacion } from '../../domain/enums/categoria-notificacion.enum';
import { DestinoNotificacion } from '../../public/notificacion.facade.port';
import {
  NotificacionInvalidaError,
  NotificacionNoEncontradaError,
} from '../../domain/errors/notificacion.errors';
import {
  NotificacionesEnMemoria,
  NotificacionEventosFake,
} from '../../test/fakes/notificacion.fake';
import { ContarNotificacionesUseCase } from './contar-notificaciones.use-case';
import { DescartarNotificacionUseCase } from './descartar-notificacion.use-case';
import { DescartarNotificacionesUseCase } from './descartar-notificaciones.use-case';
import { ListarNotificacionesUseCase } from './listar-notificaciones.use-case';
import { MarcarNotificacionLeidaUseCase } from './marcar-notificacion-leida.use-case';
import { MarcarNotificacionesLeidasUseCase } from './marcar-notificaciones-leidas.use-case';
import { NotificarUseCase } from './notificar.use-case';

const AHORA = new Date('2026-11-27T16:00:00.000Z');
const OFICINA = 1;
const ADMIN = 2;
const TECNICO = 3;

describe('Notificaciones: notificar y bandeja', () => {
  let db: NotificacionesEnMemoria;
  let eventos: NotificacionEventosFake;
  let reloj: RelojFijo;
  let notificar: NotificarUseCase;

  const crear = (
    destino: DestinoNotificacion = { roles: ['ROL_A', 'ROL_B'] },
  ) =>
    notificar.execute({
      mensaje: 'Zona procesada',
      categoria: CategoriaNotificacion.FACTURACION,
      destino,
    });

  beforeEach(() => {
    db = new NotificacionesEnMemoria();
    db.usuarios = new Map([
      [OFICINA, 'ROL_A'],
      [ADMIN, 'ROL_B'],
      [TECNICO, 'ROL_C'],
    ]);
    eventos = new NotificacionEventosFake();
    reloj = new RelojFijo(AHORA);
    notificar = new NotificarUseCase(db, db, eventos, reloj);
  });

  describe('notificar', () => {
    it('la deja en la bandeja de cada destinatario y avisa solo a ellos', async () => {
      const r = await crear();

      expect(r).toEqual({ notificacionId: 1, destinatarios: 2 });
      expect(db.filas.map((f) => f.usuarioId)).toEqual([OFICINA, ADMIN]);
      expect(eventos.emitidas).toEqual([
        { id: 1, destinatarios: [OFICINA, ADMIN] },
      ]);
    });

    it('suma usuarios y roles sin repetir', async () => {
      const r = await crear({
        roles: ['ROL_A'],
        usuarioIds: [OFICINA, TECNICO],
      });

      expect(r.destinatarios).toBe(2);
    });

    it('sin destinatarios no guarda ni avisa', async () => {
      const r = await crear({ roles: ['ROL_SIN_USUARIOS'] });

      expect(r).toEqual({ notificacionId: null, destinatarios: 0 });
      expect(db.notificaciones.size).toBe(0);
      expect(eventos.emitidas).toHaveLength(0);
    });

    it('un mensaje vacío es error del emisor', async () => {
      await expect(
        notificar.execute({
          mensaje: ' ',
          categoria: CategoriaNotificacion.BOT,
          destino: { todos: true },
        }),
      ).rejects.toThrow(NotificacionInvalidaError);
    });
  });

  describe('bandeja', () => {
    it('cada usuario ve solo la suya y cuenta sus no leídas', async () => {
      await crear();
      await crear({ roles: ['ROL_C'] });

      const listar = new ListarNotificacionesUseCase(db);
      const contar = new ContarNotificacionesUseCase(db);

      const deOficina = await listar.execute({
        usuarioId: OFICINA,
        filtros: {},
      });
      const delTecnico = await listar.execute({
        usuarioId: TECNICO,
        filtros: {},
      });

      expect(deOficina.items.map((n) => n.id)).toEqual([1]);
      expect(delTecnico.items.map((n) => n.id)).toEqual([2]);
      expect(await contar.execute({ usuarioId: OFICINA })).toEqual({
        noLeidas: 1,
      });
    });

    it('marcar leída es idempotente y conserva la primera fecha', async () => {
      await crear();
      const leer = new MarcarNotificacionLeidaUseCase(db, reloj);

      await leer.execute({ usuarioId: OFICINA, notificacionId: 1 });
      reloj.avanzar({ horas: 1 });
      await leer.execute({ usuarioId: OFICINA, notificacionId: 1 });

      expect(db.filas[0].leidaEn).toEqual(AHORA);
      expect(db.filas[1].leidaEn).toBeNull();
    });

    it('no se puede tocar una notificación ajena', async () => {
      await crear();

      await expect(
        new MarcarNotificacionLeidaUseCase(db, reloj).execute({
          usuarioId: TECNICO,
          notificacionId: 1,
        }),
      ).rejects.toThrow(NotificacionNoEncontradaError);
      await expect(
        new DescartarNotificacionUseCase(db, reloj).execute({
          usuarioId: TECNICO,
          notificacionId: 1,
        }),
      ).rejects.toThrow(NotificacionNoEncontradaError);
    });

    it('descartar la quita de su bandeja y no de la de otros', async () => {
      await crear();
      const descartar = new DescartarNotificacionUseCase(db, reloj);

      await descartar.execute({ usuarioId: OFICINA, notificacionId: 1 });

      const listar = new ListarNotificacionesUseCase(db);
      expect(
        (await listar.execute({ usuarioId: OFICINA, filtros: {} })).total,
      ).toBe(0);
      expect(
        (await listar.execute({ usuarioId: ADMIN, filtros: {} })).total,
      ).toBe(1);
      await expect(
        descartar.execute({ usuarioId: OFICINA, notificacionId: 1 }),
      ).rejects.toThrow(NotificacionNoEncontradaError);
    });

    it('marcar y descartar todas solo afecta la bandeja propia', async () => {
      await crear();
      await crear();

      expect(
        await new MarcarNotificacionesLeidasUseCase(db, reloj).execute({
          usuarioId: OFICINA,
        }),
      ).toEqual({ marcadas: 2 });
      expect(
        await new DescartarNotificacionesUseCase(db, reloj).execute({
          usuarioId: OFICINA,
        }),
      ).toEqual({ descartadas: 2 });
      expect(
        await new ContarNotificacionesUseCase(db).execute({ usuarioId: ADMIN }),
      ).toEqual({ noLeidas: 2 });
    });

    it('pagina con los valores por defecto', async () => {
      for (let i = 0; i < 12; i++) await crear();

      const r = await new ListarNotificacionesUseCase(db).execute({
        usuarioId: OFICINA,
        filtros: {},
      });

      expect(r).toMatchObject({ total: 12, page: 1, limit: 10 });
      expect(r.items).toHaveLength(10);
    });
  });
});
