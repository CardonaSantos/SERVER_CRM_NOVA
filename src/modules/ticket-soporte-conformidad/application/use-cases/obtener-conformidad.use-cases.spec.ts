import {
  TicketConformidadNoEncontradaError,
  TicketConformidadTicketNoEncontradoError,
  TicketSinConformidadError,
} from '../../domain/errors/ticket-soporte-conformidad.errors';
import {
  TicketConformidadDetalleReadModel,
  TicketConformidadHistorialReadModel,
} from '../../domain/read-models/ticket-soporte-conformidad.read-model';
import { TicketConformidadQueryFake } from '../../test/fakes/ticket-conformidad-query.fake';
import { ObtenerConformidadActualTicketUseCase } from './obtener-conformidad-actual-ticket.use-case';
import { ObtenerDetalleTicketConformidadUseCase } from './obtener-detalle-ticket-conformidad.use-case';
import { ObtenerHistorialConformidadTicketUseCase } from './obtener-historial-conformidad-ticket.use-case';

describe('consultar la conformidad de un ticket', () => {
  let consulta: TicketConformidadQueryFake;
  const detalle = { id: 1 } as TicketConformidadDetalleReadModel;
  const historial = {
    conformidades: [],
  } as unknown as TicketConformidadHistorialReadModel;

  beforeEach(() => {
    consulta = new TicketConformidadQueryFake();
  });

  it('el detalle devuelve la conformidad o 404 de dominio', async () => {
    const useCase = new ObtenerDetalleTicketConformidadUseCase(consulta);

    await expect(useCase.execute(1)).rejects.toThrow(
      TicketConformidadNoEncontradaError,
    );

    consulta.detalle = detalle;

    await expect(useCase.execute(1)).resolves.toBe(detalle);
  });

  it('la actual devuelve el ciclo más reciente o dice que el ticket no tiene', async () => {
    const useCase = new ObtenerConformidadActualTicketUseCase(consulta);

    await expect(useCase.execute(10)).rejects.toThrow(
      TicketSinConformidadError,
    );

    consulta.detalle = detalle;

    await expect(useCase.execute(10)).resolves.toBe(detalle);
  });

  it('el historial devuelve todos los ciclos o 404 si el ticket no existe', async () => {
    const useCase = new ObtenerHistorialConformidadTicketUseCase(consulta);

    await expect(useCase.execute(10)).rejects.toThrow(
      TicketConformidadTicketNoEncontradoError,
    );

    consulta.historial = historial;

    await expect(useCase.execute(10)).resolves.toBe(historial);
  });
});
