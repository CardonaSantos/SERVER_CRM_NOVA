import { EstadoMetaTicket } from '../../domain/enums/estado-meta-ticket.enum';
import { OrdenMetaTicket } from '../../domain/enums/orden-meta-ticket.enum';
import {
  MetaTicketCanceladaError,
  MetaTicketNoEncontradaError,
  MetaTicketSolapadaError,
  MetaTicketTecnicoNoDisponibleError,
} from '../../domain/errors/ticket-soporte-metrica.errors';
import {
  crearBaseMetricas,
  ticketResuelto,
} from '../../test/fakes/ticket-soporte-metrica.fake';
import { ActualizarMetaTicketUseCase } from './actualizar-meta-ticket.use-case';
import { CancelarMetaTicketUseCase } from './cancelar-meta-ticket.use-case';
import { CrearMetaTicketUseCase } from './crear-meta-ticket.use-case';
import { ListarMetasTicketUseCase } from './listar-metas-ticket.use-case';
import { ObtenerResueltosPorDiaUseCase } from './obtener-resueltos-por-dia.use-case';
import { ObtenerResumenMetricasUseCase } from './obtener-resumen-metricas.use-case';

const julio = {
  tecnicoId: 1,
  fechaInicio: '2026-07-01',
  fechaFin: '2026-07-31',
  objetivo: 4,
};

function armar() {
  const base = crearBaseMetricas();
  const { metas, tickets, reloj, unidad, avance } = base;

  return {
    ...base,
    crear: new CrearMetaTicketUseCase(metas, metas, unidad, reloj, avance),
    actualizar: new ActualizarMetaTicketUseCase(metas, unidad, reloj, avance),
    cancelar: new CancelarMetaTicketUseCase(metas, reloj, avance),
    listar: new ListarMetasTicketUseCase(metas, avance),
    resumen: new ObtenerResumenMetricasUseCase(tickets, reloj),
    porDia: new ObtenerResueltosPorDiaUseCase(tickets, reloj),
  };
}

describe('metas de tickets', () => {
  it('al crear devuelve el avance ya calculado', async () => {
    const t = armar();
    t.tickets.tickets = [ticketResuelto(1, [1], '2026-07-02')];

    const meta = await t.crear.execute(julio);

    expect(meta).toMatchObject({
      id: 1,
      avance: 1,
      faltantes: 3,
      estado: EstadoMetaTicket.EN_CURSO,
    });
    expect(t.metas.bloqueados).toEqual([1]);
  });

  it.each([3, 99])('no crea para el usuario %i', async (tecnicoId) => {
    await expect(
      armar().crear.execute({ ...julio, tecnicoId }),
    ).rejects.toThrow(MetaTicketTecnicoNoDisponibleError);
  });

  it('rechaza fechas encimadas del mismo técnico', async () => {
    const t = armar();
    await t.crear.execute(julio);

    await expect(
      t.crear.execute({
        ...julio,
        fechaInicio: '2026-07-31',
        fechaFin: '2026-08-15',
      }),
    ).rejects.toThrow(MetaTicketSolapadaError);
    await expect(
      t.crear.execute({ ...julio, tecnicoId: 2 }),
    ).resolves.toBeDefined();
  });

  it('cancelar libera las fechas y deja la meta a la vista', async () => {
    const t = armar();
    await t.crear.execute(julio);

    const cancelada = await t.cancelar.execute({ metaId: 1 });

    expect(cancelada.estado).toBe(EstadoMetaTicket.CANCELADA);
    await expect(t.crear.execute(julio)).resolves.toBeDefined();
    await expect(t.cancelar.execute({ metaId: 1 })).rejects.toThrow(
      MetaTicketCanceladaError,
    );
  });

  it('al editar valida el solape solo si cambian las fechas', async () => {
    const t = armar();
    await t.crear.execute(julio);
    await t.crear.execute({
      ...julio,
      fechaInicio: '2026-08-01',
      fechaFin: '2026-08-31',
    });

    await expect(
      t.actualizar.execute({ metaId: 1, objetivo: 9 }),
    ).resolves.toMatchObject({ objetivo: 9 });
    await expect(
      t.actualizar.execute({ metaId: 1, fechaFin: '2026-08-01' }),
    ).rejects.toThrow(MetaTicketSolapadaError);
    await expect(
      t.actualizar.execute({ metaId: 1, fechaFin: '2026-07-15' }),
    ).resolves.toMatchObject({ fechaFin: '2026-07-15' });
    await expect(
      t.actualizar.execute({ metaId: 7, objetivo: 1 }),
    ).rejects.toThrow(MetaTicketNoEncontradaError);
  });

  it('lista con filtro por estado, orden y paginación', async () => {
    const t = armar();
    await t.crear.execute({
      ...julio,
      fechaInicio: '2026-06-01',
      fechaFin: '2026-06-30',
      titulo: 'Junio',
    });
    await t.crear.execute(julio);
    await t.crear.execute({ ...julio, tecnicoId: 2 });

    const porDefecto = await t.listar.execute({ limit: 2 });
    expect(porDefecto.total).toBe(3);
    expect(porDefecto.items.map((m) => m.id)).toEqual([3, 2]);

    const vencidas = await t.listar.execute({
      estados: [EstadoMetaTicket.NO_CUMPLIDA],
    });
    expect(vencidas.items.map((m) => m.titulo)).toEqual(['Junio']);

    const porTecnico = await t.listar.execute({
      desde: '2026-07-01',
      sortBy: OrdenMetaTicket.TECNICO,
      sortDir: 'asc',
    });
    expect(porTecnico.items.map((m) => m.tecnico.nombre)).toEqual([
      'Ana',
      'Beto',
    ]);

    await expect(t.listar.execute({ search: 'jun' })).resolves.toMatchObject({
      total: 1,
    });
  });
});

describe('métricas', () => {
  function conTickets() {
    const t = armar();
    t.tickets.tickets = [
      ticketResuelto(1, [1, 2], '2026-07-02', '2026-06-29'),
      ticketResuelto(2, [3], '2026-07-02'),
      {
        id: 3,
        tecnicoIds: [1],
        diaApertura: '2026-07-05',
        diaCierre: null,
        horasHastaCierre: null,
      },
      ticketResuelto(4, [4], '2026-08-01', '2026-07-30'),
    ];

    return t;
  }

  it('resume el mes actual por técnico, contando principal y apoyo', async () => {
    const r = await conTickets().resumen.execute({});

    expect(r).toMatchObject({
      mes: '2026-07',
      diasTotales: 31,
      diasTranscurridos: 10,
      resueltosDelMes: 2,
    });
    expect(r.tecnicos.map((t) => t.tecnico.nombre)).toEqual([
      'Ana',
      'Beto',
      'Carla',
      'Dani',
    ]);
    expect(r.tecnicos[0]).toMatchObject({
      totalTickets: 2,
      resueltos: 1,
      pendientes: 1,
      tasaResolucion: 50,
      horasPromedio: 2,
      resueltosPorDia: 0.1,
      proyeccion: 3,
    });
    // Resuelto en agosto: en julio cuenta como pendiente.
    expect(r.tecnicos[3]).toMatchObject({ resueltos: 0, pendientes: 1 });
  });

  it('sin tickets muestra solo a los técnicos activos', async () => {
    const r = await armar().resumen.execute({ mes: '2026-01' });

    expect(r.tecnicos.map((t) => t.tecnico.id)).toEqual([1, 2]);
    expect(r.diasTranscurridos).toBe(31);
  });

  it('por día cuenta una vez el ticket compartido en el total', async () => {
    const r = await conTickets().porDia.execute({ mes: '2026-07' });

    expect(r.dias).toHaveLength(31);
    expect(r.dias[1]).toEqual({
      fecha: '2026-07-02',
      total: 2,
      porTecnico: [
        { tecnicoId: 1, resueltos: 1 },
        { tecnicoId: 2, resueltos: 1 },
        { tecnicoId: 3, resueltos: 1 },
      ],
    });
    expect(r.tecnicos.map((t) => t.id)).toEqual([1, 2, 3]);
  });
});
