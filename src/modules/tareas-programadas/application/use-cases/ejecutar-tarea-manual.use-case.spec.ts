import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import { EjecucionTareaEntity } from '../../domain/entities/ejecucion-tarea.entity';
import {
  EstadoEjecucionTarea,
  OrigenEjecucionTarea,
} from '../../domain/enums/ejecucion-tarea.enum';
import {
  EjecucionTareaInvalidaError,
  TareaProgramadaEnCursoError,
  TareaProgramadaNoManualError,
} from '../../domain/errors/tareas-programadas.errors';
import { EjecucionTareaRepositoryFake } from '../../test/fakes/ejecucion-tarea-repository.fake';
import { TemporizadorFake } from '../../test/fakes/temporizador.fake';
import { ReautenticacionOperadorPort } from '../ports/reautenticacion-operador.port';
import { RegistroTareasManualesService } from '../services/registro-tareas-manuales.service';
import { EjecutarTareaManualUseCase } from './ejecutar-tarea-manual.use-case';
import { EjecutarTareaProgramadaUseCase } from './ejecutar-tarea-programada.use-case';

const FECHA = '2027-03-06';
const CLAVE = `LIMPIEZA_SESIONES:${FECHA}`;
const SUPER_ADMIN = 7;

class ContrasenaIncorrectaError extends Error {}

function preparar() {
  // 11:00 de Guatemala.
  const reloj = new RelojFijo('2027-03-06T17:00:00.000Z');
  const repo = new EjecucionTareaRepositoryFake();
  const tareas = new EjecutarTareaProgramadaUseCase(
    repo,
    { activas: true },
    new TemporizadorFake(),
    reloj,
  );
  const registro = new RegistroTareasManualesService();
  const confirmadas: Array<[number, string]> = [];
  const reautenticacion: ReautenticacionOperadorPort = {
    confirmar: (usuarioId, contrasena) => {
      if (contrasena !== 'correcta') throw new ContrasenaIncorrectaError();
      confirmadas.push([usuarioId, contrasena]);
      return Promise.resolve();
    },
  };
  const trabajo = jest.fn(async () => {});
  registro.registrar({
    tarea: 'LIMPIEZA_SESIONES',
    descripcion: 'Borra sesiones muertas.',
    ejecutar: (quien) =>
      tareas.execute({
        clave: CLAVE,
        tarea: 'LIMPIEZA_SESIONES',
        fechaOperativa: FECHA,
        origen: OrigenEjecucionTarea.MANUAL,
        ejecutadaPorId: quien.ejecutadaPorId,
        trabajo,
      }),
  });
  const useCase = new EjecutarTareaManualUseCase(
    registro,
    repo,
    reautenticacion,
    reloj,
  );
  return { reloj, repo, registro, trabajo, confirmadas, useCase };
}

const entrada = (
  tarea = 'LIMPIEZA_SESIONES',
  contrasenaActual = 'correcta',
) => ({
  tarea,
  usuarioId: SUPER_ADMIN,
  contrasenaActual,
});

describe('EjecutarTareaManualUseCase', () => {
  it('confirma la contraseña, la ejecuta y deja quién la lanzó', async () => {
    const { repo, trabajo, confirmadas, useCase } = preparar();

    const r = await useCase.execute(entrada());

    expect(r).toMatchObject({
      resultado: 'EJECUTADA',
      estado: EstadoEjecucionTarea.COMPLETADA,
    });
    expect(confirmadas).toEqual([[SUPER_ADMIN, 'correcta']]);
    expect(trabajo).toHaveBeenCalledTimes(1);
    expect(repo.fila(CLAVE)).toMatchObject({
      origen: OrigenEjecucionTarea.MANUAL,
      ejecutadaPorId: SUPER_ADMIN,
    });
  });

  it('una tarea no registrada como manual es 403, sin pedir la contraseña', async () => {
    const { confirmadas, useCase } = preparar();

    await expect(useCase.execute(entrada('JORNADA'))).rejects.toBeInstanceOf(
      TareaProgramadaNoManualError,
    );
    expect(confirmadas).toEqual([]);
  });

  it('con la contraseña incorrecta no ejecuta nada', async () => {
    const { trabajo, useCase } = preparar();

    await expect(
      useCase.execute(entrada('LIMPIEZA_SESIONES', 'otra')),
    ).rejects.toBeInstanceOf(ContrasenaIncorrectaError);
    expect(trabajo).not.toHaveBeenCalled();
  });

  it('ya completada hoy, no se repite y lo informa', async () => {
    const { trabajo, useCase } = preparar();
    await useCase.execute(entrada());

    const r = await useCase.execute(entrada());

    expect(r).toMatchObject({ resultado: 'OMITIDA', motivo: 'COMPLETADA' });
    expect(trabajo).toHaveBeenCalledTimes(1);
  });

  it('si la tarea está en curso responde 409', async () => {
    const { repo, reloj, useCase } = preparar();
    await repo.crear(
      EjecucionTareaEntity.iniciar(
        {
          clave: CLAVE,
          tarea: 'LIMPIEZA_SESIONES',
          fechaOperativa: FECHA,
          origen: OrigenEjecucionTarea.PROGRAMADA,
          ejecutadaPorId: null,
        },
        reloj.ahora(),
      ),
    );

    await expect(useCase.execute(entrada())).rejects.toBeInstanceOf(
      TareaProgramadaEnCursoError,
    );
  });

  it('mientras corre la jornada del día responde 409 sin ejecutar', async () => {
    const { repo, reloj, trabajo, useCase } = preparar();
    await repo.crear(
      EjecucionTareaEntity.iniciar(
        {
          clave: `JORNADA:${FECHA}`,
          tarea: 'JORNADA',
          fechaOperativa: FECHA,
          origen: OrigenEjecucionTarea.PROGRAMADA,
          ejecutadaPorId: null,
        },
        reloj.ahora(),
      ),
    );

    await expect(useCase.execute(entrada())).rejects.toBeInstanceOf(
      TareaProgramadaEnCursoError,
    );
    expect(trabajo).not.toHaveBeenCalled();

    // Abandonada (arriendo vencido) ya no bloquea.
    reloj.avanzar({ minutos: 11 });
    await expect(useCase.execute(entrada())).resolves.toMatchObject({
      resultado: 'EJECUTADA',
    });
  });

  it('el registro rechaza nombres inválidos o repetidos', () => {
    const { registro } = preparar();
    const ejecutar = () => Promise.reject(new Error('no se llama'));

    expect(() =>
      registro.registrar({ tarea: 'limpieza', descripcion: 'x', ejecutar }),
    ).toThrow(EjecucionTareaInvalidaError);
    expect(() =>
      registro.registrar({
        tarea: 'LIMPIEZA_SESIONES',
        descripcion: 'x',
        ejecutar,
      }),
    ).toThrow(EjecucionTareaInvalidaError);
    expect(registro.disponibles()).toEqual([
      { tarea: 'LIMPIEZA_SESIONES', descripcion: 'Borra sesiones muertas.' },
    ]);
  });
});
