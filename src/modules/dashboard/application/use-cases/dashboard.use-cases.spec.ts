import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { PresetActividad } from '../../domain/enums/preset-actividad.enum';
import { DashboardUsuarioNoEncontradoError } from '../../domain/errors/dashboard.errors';
import { RangoFechas } from '../../domain/policies/calendario.policy';
import { ObtenerActividadTicketsUseCase } from './obtener-actividad-tickets.use-case';
import { ObtenerPanelTecnicoUseCase } from './obtener-panel-tecnico.use-case';
import { ObtenerResumenUseCase } from './obtener-resumen.use-case';

// 23:30 del 30 de noviembre en Guatemala; en UTC ya es diciembre.
const reloj = new RelojFijo('2026-12-01T05:30:00.000Z');

describe('casos de uso del dashboard', () => {
  it('el resumen usa el mes de Guatemala y suma la cartera', async () => {
    let pedido: RangoFechas | undefined;
    const useCase = new ObtenerResumenUseCase(
      {
        findDatos: (rango) => {
          pedido = rango;
          return Promise.resolve({
            totalEnSistema: 12,
            servicio: {
              activos: 5,
              suspendidos: 2,
              pendientesActivacion: 1,
              enInstalacion: 1,
              desinstalados: 3,
            },
            cobranza: {
              alDia: 9,
              pagoPendiente: 0,
              atrasados: 0,
              morosos: 0,
            },
            facturacion: {
              facturasEmitidasMes: 0,
              facturasPagadasMes: 0,
              montoFacturadoMes: 0,
              montoCobradoMes: 0,
              montoPendienteMes: 0,
            },
          });
        },
      },
      reloj,
    );

    const resumen = await useCase.execute();

    expect(pedido).toEqual({
      desde: '2026-11-01',
      hastaExclusivo: '2026-12-01',
    });
    expect(resumen.periodo.hasta).toBe('2026-11-30');
    expect(resumen.clientes.resumen.carteraActual).toBe(9);
  });

  it('la actividad consulta también el período con el que compara', async () => {
    const pedidos: RangoFechas[] = [];
    const guardar = (rango: RangoFechas) => {
      pedidos.push(rango);
      return Promise.resolve([]);
    };
    const useCase = new ObtenerActividadTicketsUseCase(
      {
        findPrimeraApertura: () => Promise.resolve(null),
        findCreados: guardar,
        findResueltos: guardar,
        findPendientes: () => Promise.resolve([]),
      },
      reloj,
    );

    const resultado = await useCase.execute({});

    expect(resultado.periodo.preset).toBe(PresetActividad.ULTIMOS_7_DIAS);
    expect(pedidos).toEqual([
      { desde: '2026-11-17', hastaExclusivo: '2026-12-01' },
      { desde: '2026-11-17', hastaExclusivo: '2026-12-01' },
    ]);
  });

  it('el panel de un usuario que no existe responde no encontrado', async () => {
    const useCase = new ObtenerPanelTecnicoUseCase(
      {
        findTecnico: () => Promise.resolve(null),
        contarCarga: () => Promise.reject(new Error('no debe llegar')),
        findTicketsResueltos: () => Promise.resolve([]),
        findInstalacionesCompletadas: () => Promise.resolve([]),
      },
      reloj,
    );

    await expect(useCase.execute({ usuarioId: 9 })).rejects.toThrow(
      DashboardUsuarioNoEncontradoError,
    );
  });
});
