import { crearResultadoPaginado } from 'src/common/hexagonal/paginacion';
import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import {
  EstadoEjecucionTarea,
  OrigenEjecucionTarea,
} from '../../domain/enums/ejecucion-tarea.enum';
import { EjecucionTareaQueryPort } from '../../domain/ports/ejecucion-tarea-query.port';
import { EjecucionTareaListItem } from '../../domain/read-models/ejecucion-tarea-listado.read-model';
import { ListarEjecucionesTareaUseCase } from './listar-ejecuciones-tarea.use-case';

const AHORA = new Date('2027-03-06T17:00:00.000Z');

const fila = (
  id: number,
  estado: EstadoEjecucionTarea,
  bloqueadoHasta: Date | null,
): EjecucionTareaListItem => ({
  id,
  clave: `PRUEBA:${id}`,
  tarea: 'PRUEBA',
  facturacionZonaId: null,
  fechaOperativa: '2027-03-06',
  origen: OrigenEjecucionTarea.PROGRAMADA,
  ejecutadaPorId: null,
  estado,
  intentos: 1,
  bloqueadoHasta,
  siguienteIntentoEn: null,
  iniciadaEn: AHORA,
  finalizadaEn: null,
  procesados: 0,
  errores: 0,
  resumen: null,
  errorCodigo: null,
  errorMensaje: null,
});

describe('ListarEjecucionesTareaUseCase', () => {
  it('normaliza la página, pasa los filtros y marca las abandonadas', async () => {
    const pedidos: unknown[] = [];
    const consulta: EjecucionTareaQueryPort = {
      findMany: (filtros, paginacion) => {
        pedidos.push({ filtros, paginacion });
        return Promise.resolve(
          crearResultadoPaginado(
            [
              fila(
                1,
                EstadoEjecucionTarea.EJECUTANDO,
                new Date(AHORA.getTime() + 60_000),
              ),
              fila(2, EstadoEjecucionTarea.EJECUTANDO, AHORA),
              fila(3, EstadoEjecucionTarea.COMPLETADA, null),
            ],
            3,
            paginacion,
          ),
        );
      },
    };

    const r = await new ListarEjecucionesTareaUseCase(
      consulta,
      new RelojFijo(AHORA),
    ).execute({ tarea: 'PRUEBA', estados: [EstadoEjecucionTarea.EJECUTANDO] });

    expect(pedidos).toEqual([
      {
        filtros: {
          tarea: 'PRUEBA',
          estados: [EstadoEjecucionTarea.EJECUTANDO],
        },
        paginacion: { page: 1, limit: 10 },
      },
    ]);
    expect(r.items.map((i) => [i.id, i.abandonada])).toEqual([
      [1, false],
      [2, true],
      [3, false],
    ]);
    expect(r.total).toBe(3);
  });
});
