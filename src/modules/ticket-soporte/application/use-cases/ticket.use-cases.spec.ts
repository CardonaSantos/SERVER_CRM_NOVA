import { PrioridadTicket } from '../../domain/enums/prioridad-ticket.enum';
import {
  ComentarioAjenoError,
  ComentarioImagenInvalidaError,
  ComentarioImagenNoEncontradaError,
  ComentarioInvalidoError,
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
import { EditarComentarioTicketUseCase } from './editar-comentario-ticket.use-case';
import { EliminarComentarioTicketUseCase } from './eliminar-comentario-ticket.use-case';
import { QuitarImagenComentarioTicketUseCase } from './quitar-imagen-comentario-ticket.use-case';

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
    editar: new EditarComentarioTicketUseCase(
      base.acceso,
      comentarios,
      base.unidad,
      base.reloj,
    ),
    quitar: new QuitarImagenComentarioTicketUseCase(
      base.acceso,
      comentarios,
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

const NUEVO = {
  ...OFICINA,
  puedeAsignar: true,
  empresaId: 1,
  titulo: 'Sin señal',
};

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

  it('un técnico crea, pero no asigna ni fija', async () => {
    const t = armar();
    const base = { ...NUEVO, ...TECNICO, puedeAsignar: false };

    await expect(t.crear.execute(base)).resolves.toBeDefined();
    await expect(t.crear.execute({ ...base, tecnicoId: 1 })).rejects.toThrow(
      TicketAccionDeOficinaError,
    );
    await expect(t.crear.execute({ ...base, fijado: true })).rejects.toThrow(
      TicketAccionDeOficinaError,
    );
  });

  it('otro rol que no es oficina sí asigna y fija', async () => {
    const t = armar();

    await expect(
      t.crear.execute({
        ...NUEVO,
        gestiona: false,
        tecnicoId: 1,
        fijado: true,
      }),
    ).resolves.toBeDefined();
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

  it('quien no es oficina asigna y fija aunque reenvíe el resto igual', async () => {
    const t = armar();
    const ticketId = await t.sembrar({ etiquetaIds: [100, 101] });

    await t.actualizar.execute({
      ticketId,
      ...OFICINA,
      gestiona: false,
      cambios: {
        titulo: 'Sin señal',
        etiquetaIds: [101, 100],
        tecnicoId: 2,
        fijado: true,
      },
    });

    expect(t.tickets.tickets.get(ticketId)).toMatchObject({
      tecnicoId: 2,
      fijado: true,
    });
  });

  it('recortar un texto antiguo no cuenta como cambiarlo', async () => {
    const t = armar();
    const ticketId = await t.sembrar({});
    t.tickets.tickets.get(ticketId)!.titulo = 'Sin señal  ';

    await expect(
      t.actualizar.execute({
        ticketId,
        ...OFICINA,
        gestiona: false,
        cambios: { titulo: 'Sin señal  ', tecnicoId: 2 },
      }),
    ).resolves.toEqual({ ticketId });
  });

  it.each([
    { titulo: 'Otro' },
    { descripcion: 'Otra' },
    { prioridad: PrioridadTicket.URGENTE },
    { clienteId: 10 },
    { etiquetaIds: [100] },
  ])('quien no es oficina no cambia los datos: %o', async (cambios) => {
    const t = armar();
    const ticketId = await t.sembrar({});

    await expect(
      t.actualizar.execute({
        ticketId,
        ...OFICINA,
        gestiona: false,
        cambios: { ...cambios, tecnicoId: 2 },
      }),
    ).rejects.toThrow(TicketAccionDeOficinaError);
    expect(t.tickets.tickets.get(ticketId)?.tecnicoId).toBeNull();
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

  async function comentado(texto: string | undefined, imagenes = 0) {
    const t = armar();
    const ticketId = await t.sembrar({ tecnicoId: 1 });
    const { comentarioId } = await t.comentar.execute({
      ...datos,
      ticketId,
      texto,
      imagenes: Array(imagenes).fill(JPG),
    });
    const leer = async () =>
      (await t.comentarios.findById(comentarioId))!.toPrimitives();

    return { t, ids: { ticketId, comentarioId }, leer };
  }

  it('el autor edita su texto y queda marcado', async () => {
    const { t, ids, leer } = await comentado('hola');

    await t.editar.execute({ ...ids, usuarioId: 1, texto: ' hola de nuevo ' });

    expect(await leer()).toMatchObject({ texto: 'hola de nuevo' });
    expect((await leer()).editadoEn).not.toBeNull();
  });

  it('reenviar el mismo texto no lo marca como editado', async () => {
    const { t, ids, leer } = await comentado('hola');

    await t.editar.execute({ ...ids, usuarioId: 1, texto: 'hola' });

    expect((await leer()).editadoEn).toBeNull();
  });

  it('nadie edita lo que escribió otro, ni la oficina', async () => {
    const { t, ids } = await comentado('hola');

    await expect(
      t.editar.execute({ ...ids, usuarioId: 9, texto: 'otro' }),
    ).rejects.toThrow(ComentarioAjenoError);
  });

  it('el texto se puede vaciar solo si quedan imágenes', async () => {
    const solo = await comentado('hola');
    const conFoto = await comentado('hola', 1);

    await expect(
      solo.t.editar.execute({ ...solo.ids, usuarioId: 1, texto: '' }),
    ).rejects.toThrow(ComentarioInvalidoError);
    await expect(
      conFoto.t.editar.execute({ ...conFoto.ids, usuarioId: 1, texto: '' }),
    ).resolves.toBeDefined();
  });

  it('quita una imagen, y no la última de un comentario sin texto', async () => {
    const { t, ids, leer } = await comentado(undefined, 2);
    const actor = { ...ids, usuarioId: 1, gestiona: false };

    await t.quitar.execute({ ...actor, imagenId: 501 });

    expect((await leer()).imagenIds).toEqual([502]);
    await expect(t.quitar.execute({ ...actor, imagenId: 501 })).rejects.toThrow(
      ComentarioImagenNoEncontradaError,
    );
    await expect(t.quitar.execute({ ...actor, imagenId: 502 })).rejects.toThrow(
      ComentarioInvalidoError,
    );
  });

  it('la imagen de otro solo la quita la oficina', async () => {
    const { t, ids } = await comentado('hola', 1);
    const otro = { ...ids, usuarioId: 9, imagenId: 501 };

    await expect(
      t.quitar.execute({ ...otro, gestiona: false }),
    ).rejects.toThrow(ComentarioAjenoError);
    await expect(
      t.quitar.execute({ ...otro, gestiona: true }),
    ).resolves.toBeDefined();
  });
});
