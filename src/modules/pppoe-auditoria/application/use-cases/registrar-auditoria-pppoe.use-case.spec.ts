import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../../domain/enums/pppoe-auditoria.enum';
import { PppoeAuditoriaRepositoryFake } from '../../test/fakes/pppoe-auditoria-repository.fake';
import { PppoeAuditoriaFacade } from '../facade/pppoe-auditoria.facade';

import { RegistrarAuditoriaPppoeUseCase } from './registrar-auditoria-pppoe.use-case';

describe('PppoeAuditoriaFacade / RegistrarAuditoriaPppoeUseCase', () => {
  function preparar() {
    const repo = new PppoeAuditoriaRepositoryFake();
    const reloj = new RelojFijo('2026-11-24T18:00:00Z');
    const fachada = new PppoeAuditoriaFacade(
      new RegistrarAuditoriaPppoeUseCase(repo, reloj),
    );
    return { repo, fachada };
  }

  const comun = {
    empresaId: 1,
    operadorId: 7,
    origen: OrigenOperacionPppoe.OPERADOR,
    descripcion: 'Evento de prueba',
  };

  it('sin fecha usa la hora del reloj', async () => {
    const { repo, fachada } = preparar();

    await fachada.registrarEventoCuenta({
      ...comun,
      cuentaPppoeId: 10,
      accion: AccionAuditoriaPppoe.HOJA_VISUALIZADA,
    });

    expect(repo.eventos).toHaveLength(1);
    expect(repo.eventos[0].creadoEn.toISOString()).toBe(
      '2026-11-24T18:00:00.000Z',
    );
  });

  it('respeta la fecha exacta del evento si viene', async () => {
    const { repo, fachada } = preparar();
    const fecha = new Date('2026-11-20T10:00:00Z');

    await fachada.registrarEventoOperacion({
      ...comun,
      operacionId: 3,
      accion: AccionAuditoriaPppoe.PREALTA_CREADA,
      creadoEn: fecha,
    });

    expect(repo.eventos[0].creadoEn.toISOString()).toBe(fecha.toISOString());
    expect(repo.eventos[0].toPrimitives().operacionId).toBe(3);
  });

  it('las transiciones pasan por la regla de la entidad', async () => {
    const { repo, fachada } = preparar();

    await expect(
      fachada.registrarTransicionCuenta({
        ...comun,
        cuentaPppoeId: 10,
        accion: AccionAuditoriaPppoe.PREALTA_CREADA,
        estadoCuentaAnterior: EstadoCuentaPppoe.ACTIVA,
        estadoCuentaNuevo: EstadoCuentaPppoe.ACTIVA,
      }),
    ).rejects.toThrow(/diferentes/);
    expect(repo.eventos).toHaveLength(0);
  });
});
