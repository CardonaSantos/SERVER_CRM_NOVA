import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import { RangoFechas } from '../../domain/policies/calendario.policy';
import { FinanzasQueryPort } from '../../domain/ports/finanzas-query.port';
import { ResumenQueryPort } from '../../domain/ports/resumen-query.port';
import { DatosResumen } from '../../domain/read-models/resumen.read-model';
import { FotoMensualCarteraRepositoryFake } from '../../test/fakes/foto-mensual-cartera-repository.fake';
import { TomarFotoMensualUseCase } from './tomar-foto-mensual.use-case';

const DATOS: DatosResumen = {
  totalEnSistema: 4,
  servicio: {
    activos: 3,
    suspendidos: 1,
    pendientesActivacion: 0,
    enInstalacion: 0,
    desinstalados: 0,
  },
  cobranza: { alDia: 3, pagoPendiente: 1, atrasados: 0, morosos: 0 },
  facturacion: {
    facturasEmitidasMes: 0,
    facturasPagadasMes: 0,
    montoFacturadoMes: 0,
    montoCobradoMes: 0,
    montoPendienteMes: 0,
  },
};

function preparar() {
  // 00:30 del 1 de marzo en Guatemala.
  const reloj = new RelojFijo('2027-03-01T06:30:00.000Z');
  const rangos: RangoFechas[] = [];
  const resumen: ResumenQueryPort = {
    findDatos: (rango) => {
      rangos.push(rango);
      return Promise.resolve(DATOS);
    },
  };
  const finanzas: FinanzasQueryPort = {
    findFacturasDeMeses: () => Promise.resolve([]),
    findPagosDeMeses: () => Promise.resolve([]),
    findFacturasSinPagar: () =>
      Promise.resolve([
        {
          clienteId: 1,
          vence: '2027-02-20',
          pagada: false,
          montoPago: 150,
          saldoPendiente: 150,
          clienteDesinstalado: false,
        },
      ]),
  };
  const fotos = new FotoMensualCarteraRepositoryFake();
  const useCase = new TomarFotoMensualUseCase(resumen, finanzas, fotos, reloj);
  return { fotos, rangos, useCase };
}

describe('TomarFotoMensualUseCase', () => {
  it('guarda la foto del mes que cerró con los clientes de hoy', async () => {
    const { fotos, rangos, useCase } = preparar();

    expect(await useCase.execute()).toEqual({ mes: '2027-02', guardada: true });
    expect(rangos).toEqual([
      { desde: '2027-03-01', hastaExclusivo: '2027-03-02' },
    ]);
    expect(fotos.fotos.get('2027-02')).toMatchObject({
      mes: '2027-02',
      tomadaEn: new Date('2027-03-01T06:30:00.000Z'),
      activos: 3,
      pagoPendiente: 1,
      deuda: 150,
      deudaVencida: 150,
      clientesConDeudaVencida: 1,
    });
  });

  it('no reemplaza la foto de un mes que ya la tiene', async () => {
    const { fotos, useCase } = preparar();
    await useCase.execute();

    expect(await useCase.execute()).toEqual({
      mes: '2027-02',
      guardada: false,
    });
    expect(fotos.fotos.size).toBe(1);
  });
});
