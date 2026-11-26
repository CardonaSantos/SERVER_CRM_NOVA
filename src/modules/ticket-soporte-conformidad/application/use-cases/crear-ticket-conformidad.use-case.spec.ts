import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { TicketConformidadResultado } from '../../domain/enums/ticket-conformidad-resultado.enum';
import {
  TicketConformidadContextoIncompletoError,
  TicketConformidadPendienteExistenteError,
  TicketConformidadTicketNoEncontradoError,
} from '../../domain/errors/ticket-soporte-conformidad.errors';
import { TicketConformidadRepositoryFake } from '../../test/fakes/ticket-conformidad-repository.fake';
import { TicketSoporteContextoQueryFake } from '../../test/fakes/ticket-soporte-contexto-query.fake';
import { CrearTicketConformidadUseCase } from './crear-ticket-conformidad.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('CrearTicketConformidadUseCase', () => {
  let tickets: TicketSoporteContextoQueryFake;
  let conformidades: TicketConformidadRepositoryFake;
  let useCase: CrearTicketConformidadUseCase;

  beforeEach(() => {
    tickets = new TicketSoporteContextoQueryFake();
    conformidades = new TicketConformidadRepositoryFake();
    useCase = new CrearTicketConformidadUseCase(
      tickets,
      conformidades,
      new RelojFijo(AHORA),
    );
  });

  it('abre un ciclo PENDIENTE con el cliente y el técnico del ticket y la hora del reloj', async () => {
    tickets.sembrar();

    const creada = await useCase.execute({ ticketId: 10, creadoPorId: 3 });

    expect(creada).toEqual({
      id: 1,
      ticketId: 10,
      clienteId: 5,
      tecnicoAsignadoId: 7,
      creadoPorId: 3,
      resultado: TicketConformidadResultado.PENDIENTE,
      creadoEn: AHORA,
      actualizadoEn: AHORA,
      respondidoEn: null,
    });
    expect(conformidades.filas.size).toBe(1);
  });

  it('un ticket inexistente es 404 de dominio', async () => {
    await expect(
      useCase.execute({ ticketId: 99, creadoPorId: 3 }),
    ).rejects.toThrow(TicketConformidadTicketNoEncontradoError);
  });

  it('un ticket sin cliente no puede pedir conformidad', async () => {
    tickets.sembrar({ clienteId: null });

    await expect(
      useCase.execute({ ticketId: 10, creadoPorId: 3 }),
    ).rejects.toThrow(TicketConformidadContextoIncompletoError);
    expect(conformidades.filas.size).toBe(0);
  });

  it('no abre un segundo ciclo mientras haya uno pendiente', async () => {
    tickets.sembrar();
    conformidades.sembrar();

    await expect(
      useCase.execute({ ticketId: 10, creadoPorId: 3 }),
    ).rejects.toThrow(TicketConformidadPendienteExistenteError);
  });

  it('sí abre otro ciclo si el anterior ya fue respondido', async () => {
    tickets.sembrar();
    conformidades.sembrar({
      resultado: TicketConformidadResultado.REQUIERE_RETRABAJO,
    });

    const creada = await useCase.execute({ ticketId: 10, creadoPorId: 3 });

    expect(creada.id).toBe(2);
    expect(conformidades.filas.size).toBe(2);
  });

  it('un ticket sin técnico abre el ciclo sin técnico asignado', async () => {
    tickets.sembrar({ tecnicoId: null });

    const creada = await useCase.execute({ ticketId: 10, creadoPorId: 3 });

    expect(creada.tecnicoAsignadoId).toBeNull();
  });
});
