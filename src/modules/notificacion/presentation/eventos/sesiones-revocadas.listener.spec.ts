import { EventEmitter } from 'events';

import {
  EVENTO_SESIONES_REVOCADAS,
  SesionesService,
} from 'src/auth/sesiones/sesiones.service';

import { RevocarDispositivosDeSesionesUseCase } from '../../application/use-cases/revocar-dispositivos-de-sesiones.use-case';
import { SesionesRevocadasListener } from './sesiones-revocadas.listener';

const vaciarPromesas = () => new Promise((r) => setImmediate(r));

describe('SesionesRevocadasListener', () => {
  it('al revocarse sesiones revoca sus dispositivos y deja de escuchar al cerrar', async () => {
    const eventos = new EventEmitter();
    const execute = jest.fn().mockResolvedValue(1);
    const listener = new SesionesRevocadasListener(
      { eventos } as unknown as SesionesService,
      { execute } as unknown as RevocarDispositivosDeSesionesUseCase,
    );

    listener.onModuleInit();
    eventos.emit(EVENTO_SESIONES_REVOCADAS, ['s1', 's2']);
    await vaciarPromesas();

    expect(execute).toHaveBeenCalledWith({ sesionIds: ['s1', 's2'] });

    listener.onModuleDestroy();
    eventos.emit(EVENTO_SESIONES_REVOCADAS, ['s3']);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('un fallo no escapa del evento', async () => {
    const eventos = new EventEmitter();
    const listener = new SesionesRevocadasListener(
      { eventos } as unknown as SesionesService,
      {
        execute: jest.fn().mockRejectedValue(new Error('base caída')),
      } as unknown as RevocarDispositivosDeSesionesUseCase,
    );

    listener.onModuleInit();

    expect(() => eventos.emit(EVENTO_SESIONES_REVOCADAS, ['s1'])).not.toThrow();
    await vaciarPromesas();
  });
});
