import { TicketSoporteHistorialTipo } from 'src/modules/ticket-soporte-historial/public/ticket-soporte-historial.types';
import { EstadoTicket } from '../../domain/enums/estado-ticket.enum';
import { FaseTicket } from '../../domain/enums/fase-ticket.enum';
import {
  TicketAccionNoPermitidaError,
  TicketNoAsignadoError,
  TicketSolucionNoDisponibleError,
} from '../../domain/errors/ticket-soporte.errors';
import {
  armarTickets,
  OFICINA,
  TECNICO,
} from '../../test/fakes/ticket-soporte.fake';
import { CancelarTicketUseCase } from './cancelar-ticket.use-case';
import { EnviarTicketARevisionUseCase } from './enviar-ticket-a-revision.use-case';
import { IniciarTicketUseCase } from './iniciar-ticket.use-case';
import { ReabrirTicketUseCase } from './reabrir-ticket.use-case';
import { ResolverTicketUseCase } from './resolver-ticket.use-case';

function armar() {
  const base = armarTickets();

  return {
    ...base,
    iniciar: new IniciarTicketUseCase(base.transicion),
    revisar: new EnviarTicketARevisionUseCase(base.transicion),
    cancelar: new CancelarTicketUseCase(base.transicion),
    reabrir: new ReabrirTicketUseCase(base.transicion, base.tickets),
    resolver: new ResolverTicketUseCase(
      base.transicion,
      base.tickets,
      base.consultas,
      base.metas,
    ),
  };
}

describe('ciclo de un ticket', () => {
  it('el técnico inicia, entrega y la oficina resuelve con sus tiempos', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 1, apoyoIds: [2] });

    await t.iniciar.execute({ ticketId, ...TECNICO });
    t.reloj.avanzar({ minutos: 30 });
    await t.revisar.execute({ ticketId, ...TECNICO });
    t.reloj.avanzar({ minutos: 60 });
    await expect(
      t.resolver.execute({ ticketId, ...OFICINA, solucionId: 7 }),
    ).resolves.toEqual({ ticketId, estado: FaseTicket.RESUELTA });

    expect(t.tickets.resumenes.get(ticketId)?.cierre).toMatchObject({
      solucionId: 7,
      tiempoTecnicoMinutos: 30,
      tiempoTotalMinutos: 90,
    });
    expect(t.historial.registrarEvento).toHaveBeenCalledTimes(3);
    expect(t.avisos.cambioEstado).toHaveBeenCalledTimes(3);
    expect(t.metas.sumarResuelto.mock.calls).toEqual([[1], [2]]);
  });

  it('el reloj queda a nombre del asignado que inició', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 3, apoyoIds: [1] });

    await t.iniciar.execute({ ticketId, ...TECNICO });

    expect(t.tickets.relojes.get(ticketId)?.[0].por).toBe(1);
  });

  it('si la oficina inicia, el reloj es del técnico principal', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 3 });

    await t.iniciar.execute({ ticketId, ...OFICINA });

    expect(t.tickets.relojes.get(ticketId)?.[0].por).toBe(3);
  });

  it('iniciar dos veces no abre dos relojes ni repite avisos', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 1 });

    await t.iniciar.execute({ ticketId, ...TECNICO });
    await t.iniciar.execute({ ticketId, ...TECNICO });

    expect(t.tickets.relojes.get(ticketId)).toHaveLength(1);
    expect(t.avisos.cambioEstado).toHaveBeenCalledTimes(1);
  });

  it('un técnico ajeno no cambia el ticket', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 2 });

    await expect(t.iniciar.execute({ ticketId, ...TECNICO })).rejects.toThrow(
      TicketNoAsignadoError,
    );
    expect(t.tickets.tickets.get(ticketId)?.estado).toBe(EstadoTicket.ABIERTA);
  });

  it('resolver sin pasar por proceso deja el tiempo técnico sin registro', async () => {
    const t = armar();
    const ticketId = await t.sembrar({});

    await t.resolver.execute({ ticketId, ...OFICINA });

    expect(
      t.tickets.resumenes.get(ticketId)?.cierre?.tiempoTecnicoMinutos,
    ).toBeNull();
  });

  it('cancelar detiene el reloj y deja el motivo en la bitácora', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 1 });
    await t.iniciar.execute({ ticketId, ...TECNICO });
    t.reloj.avanzar({ minutos: 5 });

    await t.cancelar.execute({ ticketId, ...OFICINA, motivo: 'Duplicado' });

    expect(t.tickets.relojes.get(ticketId)?.[0].duracionMinutos).toBe(5);
    expect(t.historial.registrarEvento).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tipo: TicketSoporteHistorialTipo.CANCELADO,
        cambios: expect.arrayContaining([
          expect.objectContaining({ nuevo: 'Duplicado' }),
        ]),
      }),
    );
  });

  it('reabrir cuenta la reapertura y el nuevo cierre no suma a metas', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 1 });
    await t.resolver.execute({ ticketId, ...OFICINA });
    await t.reabrir.execute({ ticketId, ...OFICINA });
    t.metas.sumarResuelto.mockClear();

    await t.resolver.execute({ ticketId, ...OFICINA });

    expect(await t.tickets.reaperturas(ticketId)).toBe(1);
    expect(t.metas.sumarResuelto).not.toHaveBeenCalled();
  });

  it('un ticket resuelto no se vuelve a resolver ni se cancela', async () => {
    const t = armar();
    const ticketId = await t.sembrar({});
    await t.resolver.execute({ ticketId, ...OFICINA });

    await expect(t.resolver.execute({ ticketId, ...OFICINA })).rejects.toThrow(
      TicketAccionNoPermitidaError,
    );
    await expect(
      t.cancelar.execute({ ticketId, ...OFICINA, motivo: 'x' }),
    ).rejects.toThrow(TicketAccionNoPermitidaError);
  });

  it('no acepta una solución eliminada', async () => {
    const t = armar();
    const ticketId = await t.sembrar({});

    await expect(
      t.resolver.execute({ ticketId, ...OFICINA, solucionId: 99 }),
    ).rejects.toThrow(TicketSolucionNoDisponibleError);
  });

  it('una meta que falla no deshace el cierre', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 1 });
    t.metas.sumarResuelto.mockRejectedValueOnce(new Error('falla'));

    await expect(
      t.resolver.execute({ ticketId, ...OFICINA }),
    ).resolves.toMatchObject({ estado: FaseTicket.RESUELTA });
  });
});
