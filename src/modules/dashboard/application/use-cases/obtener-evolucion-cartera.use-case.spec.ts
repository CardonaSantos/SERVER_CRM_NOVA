import { RelojFijo } from 'src/common/reloj/reloj-fijo';

import { FotoMensualCarteraQueryPort } from '../../domain/ports/foto-mensual-cartera-query.port';
import { ObtenerEvolucionCarteraUseCase } from './obtener-evolucion-cartera.use-case';

describe('ObtenerEvolucionCarteraUseCase', () => {
  it('pide los 12 meses cerrados por defecto, o los que se indiquen', async () => {
    const pedidos: string[][] = [];
    const fotos: FotoMensualCarteraQueryPort = {
      findDeMeses: (meses) => {
        pedidos.push([...meses]);
        return Promise.resolve([]);
      },
    };
    const useCase = new ObtenerEvolucionCarteraUseCase(
      fotos,
      new RelojFijo('2027-03-15T18:00:00.000Z'),
    );

    const doce = await useCase.execute({});
    const dos = await useCase.execute({ meses: 2 });

    expect(doce.meses).toHaveLength(12);
    expect(doce.periodo).toEqual({ desde: '2026-03-01', hasta: '2027-02-28' });
    expect(pedidos[1]).toEqual(['2027-01', '2027-02']);
    expect(dos.meses.every((m) => m.tomadaEn === null)).toBe(true);
  });
});
