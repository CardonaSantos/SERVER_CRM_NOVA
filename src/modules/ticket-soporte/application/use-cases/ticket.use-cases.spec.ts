import {
  ComentarioImagenInvalidaError,
  ComentarioNoEncontradoError,
  TicketAccionDeOficinaError,
  TicketClienteNoEncontradoError,
  TicketEtiquetaNoDisponibleError,
  TicketNoAsignadoError,
  TicketTecnicoNoValidoError,
} from '../../domain/errors/ticket-soporte.errors';
import {
  armarTickets,
  ComentarioTicketRepositoryFake,
  OFICINA,
  TECNICO,
} from '../../test/fakes/ticket-soporte.fake';
import { ActualizarTicketUseCase } from './actualizar-ticket.use-case';
import { ComentarTicketUseCase } from './comentar-ticket.use-case';
import { CrearTicketBotUseCase } from './crear-ticket-bot.use-case';
import { CrearTicketUseCase } from './crear-ticket.use-case';
import { EliminarComentarioTicketUseCase } from './eliminar-comentario-ticket.use-case';

const JPG = {
  bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  nombreArchivo: 'foto.jpg',
};

function armar() {
  const base = armarTickets();
  const comentarios = new ComentarioTicketRepositoryFake();
  let media = 500;
  const almacen = {
    guardar: jest.fn(async () => ++media),
    eliminar: jest.fn(async () => undefined),
  };

  return {
    ...base,
    comentarios,
    almacen,
    crear: new CrearTicketUseCase(
      base.tickets,
      base.referencias,
      base.historial,
      base.avisos,
      base.unidad,
      base.reloj,
    ),
    bot: new CrearTicketBotUseCase(
      base.tickets,
      base.historial,
      base.avisos,
      base.unidad,
      base.reloj,
    ),
    actualizar: new ActualizarTicketUseCase(
      base.tickets,
      base.consultas,
      base.referencias,
      base.historial,
      base.avisos,
      base.unidad,
      base.reloj,
    ),
    comentar: new ComentarTicketUseCase(
      base.acceso,
      comentarios,
      almacen,
      base.unidad,
      base.reloj,
    ),
    borrar: new EliminarComentarioTicketUseCase(
      base.acceso,
      comentarios,
      base.reloj,
    ),
  };
}

const NUEVO = { ...OFICINA, empresaId: 1, titulo: 'Sin señal' };

describe('crear ticket', () => {
  it('deja bitácora, avisa a los asignados y al cliente', async () => {
    const t = armar();

    const { ticketId } = await t.crear.execute({
      ...NUEVO,
      clienteId: 10,
      tecnicoId: 1,
      telefonoTemporal: '51111111',
    });

    expect(t.tickets.tickets.get(ticketId)?.creadoPorId).toBe(9);
    expect(t.historial.registrarEvento).toHaveBeenCalledWith(
      expect.objectContaining({ ticketId, tipo: 'CREADO' }),
    );
    expect(t.avisos.asignacion).toHaveBeenCalledWith(
      expect.objectContaining({ agregados: [1], motivo: 'CREATED' }),
    );
    expect(t.avisos.clienteTicketCreado).toHaveBeenCalledWith(
      expect.objectContaining({ telefonos: ['50000000', '51111111'] }),
    );
  });

  it.each([
    [{ clienteId: 99 }, TicketClienteNoEncontradoError],
    [{ tecnicoId: 99 }, TicketTecnicoNoValidoError],
    [{ etiquetaIds: [999] }, TicketEtiquetaNoDisponibleError],
  ])('rechaza referencias que no sirven: %o', async (datos, error) => {
    const t = armar();

    await expect(t.crear.execute({ ...NUEVO, ...datos })).rejects.toThrow(
      error,
    );
    expect(t.tickets.tickets.size).toBe(0);
  });

  it('quien no es oficina crea, pero no asigna ni fija', async () => {
    const t = armar();
    const base = { ...NUEVO, ...TECNICO };

    await expect(t.crear.execute(base)).resolves.toBeDefined();
    await expect(t.crear.execute({ ...base, tecnicoId: 1 })).rejects.toThrow(
      TicketAccionDeOficinaError,
    );
    await expect(t.crear.execute({ ...base, fijado: true })).rejects.toThrow(
      TicketAccionDeOficinaError,
    );
  });

  it('el del bot entra abierto, urgente, fijado y firmado', async () => {
    const t = armar();

    const ticket = await t.bot.execute({
      titulo: 'Caída',
      descripcion: 'Sin internet',
    });

    expect(ticket).toMatchObject({
      estado: 'ABIERTA',
      prioridad: 'URGENTE',
      fijado: true,
      empresaId: null,
    });
    expect(ticket.descripcion).toContain('Creado por Botsito');
    expect(t.avisos.ticketDelBot).toHaveBeenCalled();
  });
});

describe('editar ticket', () => {
  it('avisa solo a quien entra o sale y nombra los cambios', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 1, apoyoIds: [2] });

    await t.actualizar.execute({
      ticketId,
      ...OFICINA,
      cambios: { tecnicoId: 3, apoyoIds: [2] },
    });

    expect(t.avisos.asignacion).toHaveBeenCalledWith(
      expect.objectContaining({ agregados: [3], retirados: [1] }),
    );
    expect(t.historial.registrarActualizacion).toHaveBeenCalledWith(
      expect.objectContaining({
        cambios: expect.arrayContaining([
          {
            campo: 'tecnicoPrincipal',
            anterior: 'Usuario 1',
            nuevo: 'Usuario 3',
          },
        ]),
      }),
    );
  });

  it('conserva lo que ya tenía aunque se haya desactivado', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 1, etiquetaIds: [100] });
    t.consultas.usuarios.delete(1);
    t.consultas.etiquetas.delete(100);

    await expect(
      t.actualizar.execute({
        ticketId,
        ...OFICINA,
        cambios: { titulo: 'Otro', etiquetaIds: [100] },
      }),
    ).resolves.toEqual({ ticketId });
    expect(t.avisos.asignacion).not.toHaveBeenCalled();
  });
});

describe('comentarios', () => {
  const datos = { usuarioId: 1, empresaId: 1, soloAsignadosA: 1 };

  it('guarda las imágenes en orden', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 1 });

    const { comentarioId } = await t.comentar.execute({
      ...datos,
      ticketId,
      imagenes: [JPG, JPG],
    });

    expect(t.comentarios.guardados.get(comentarioId)?.mediaIds).toEqual([
      501, 502,
    ]);
  });

  it('no sube nada si una imagen no sirve o el ticket es ajeno', async () => {
    const t = armar();
    const ajeno = await t.sembrar({ tecnicoId: 2 });
    const propio = await t.sembrar({ tecnicoId: 1 });

    await expect(
      t.comentar.execute({ ...datos, ticketId: ajeno, imagenes: [JPG] }),
    ).rejects.toThrow(TicketNoAsignadoError);
    await expect(
      t.comentar.execute({
        ...datos,
        ticketId: propio,
        imagenes: [JPG, { bytes: Buffer.from('x'), nombreArchivo: 'x' }],
      }),
    ).rejects.toThrow(ComentarioImagenInvalidaError);
    expect(t.almacen.guardar).not.toHaveBeenCalled();
  });

  it('si no se puede guardar, borra lo subido', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 1 });
    t.comentarios.fallar = true;

    await expect(
      t.comentar.execute({ ...datos, ticketId, imagenes: [JPG, JPG] }),
    ).rejects.toThrow('base caída');
    expect(t.almacen.eliminar.mock.calls).toEqual([
      [501, 1],
      [502, 1],
    ]);
  });

  it('borrar exige que el comentario sea de ese ticket', async () => {
    const t = armar();
    const uno = await t.sembrar({ tecnicoId: 1 });
    const otro = await t.sembrar({ tecnicoId: 1 });
    const { comentarioId } = await t.comentar.execute({
      ...datos,
      ticketId: uno,
      texto: 'hola',
      imagenes: [],
    });

    await expect(
      t.borrar.execute({
        ticketId: otro,
        comentarioId,
        usuarioId: 1,
        gestiona: false,
      }),
    ).rejects.toThrow(ComentarioNoEncontradoError);
    await expect(
      t.borrar.execute({
        ticketId: uno,
        comentarioId,
        usuarioId: 1,
        gestiona: false,
      }),
    ).resolves.toEqual({ comentarioId });
  });
});
