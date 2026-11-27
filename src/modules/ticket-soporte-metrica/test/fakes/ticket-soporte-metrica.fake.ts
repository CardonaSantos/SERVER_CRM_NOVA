import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { AvanceMetasService } from '../../application/services/avance-metas.service';
import { MetaTicketEntity } from '../../domain/entities/meta-ticket.entity';
import { MetaTicketCanceladaError } from '../../domain/errors/ticket-soporte-metrica.errors';
import { MetaTicketQueryPort } from '../../domain/ports/meta-ticket-query.port';
import {
  BuscarSolapadaParams,
  MetaTicketRepositoryPort,
} from '../../domain/ports/meta-ticket-repository.port';
import { MetricaTicketQueryPort } from '../../domain/ports/metrica-ticket-query.port';
import {
  MetaTicketReadModel,
  TecnicoMetrica,
} from '../../domain/read-models/meta-ticket.read-model';
import {
  SituacionTickets,
  TicketPeriodoReadModel,
} from '../../domain/read-models/metrica-ticket.read-model';

export class MetaTicketFake
  implements MetaTicketRepositoryPort, MetaTicketQueryPort
{
  readonly metas: MetaTicketEntity[] = [];
  readonly bloqueados: number[] = [];

  constructor(readonly usuarios: TecnicoMetrica[]) {}

  async create(meta: MetaTicketEntity) {
    const guardada = MetaTicketEntity.hydrate({
      ...meta.toPrimitives(),
      id: this.metas.length + 1,
    });
    this.metas.push(guardada);

    return this.copia(guardada);
  }

  async update(meta: MetaTicketEntity) {
    const indice = this.metas.findIndex((m) => m.id === meta.id);
    if (this.metas[indice].toPrimitives().cancelada) {
      throw new MetaTicketCanceladaError();
    }
    this.metas[indice] = this.copia(meta);
  }

  async findById(id: number) {
    const meta = this.metas.find((m) => m.id === id);

    return meta ? this.copia(meta) : null;
  }

  async bloquearTecnico(tecnicoId: number) {
    this.bloqueados.push(tecnicoId);
  }

  async existeSolapada(p: BuscarSolapadaParams) {
    return this.metas.some((m) => {
      const meta = m.toPrimitives();

      return (
        meta.tecnicoId === p.tecnicoId &&
        !meta.cancelada &&
        meta.id !== p.excluirId &&
        meta.fechaInicio <= p.fechaFin &&
        meta.fechaFin >= p.fechaInicio
      );
    });
  }

  async findMany(filtros: { tecnicoId?: number }) {
    return this.metas
      .filter((m) => !filtros.tecnicoId || m.tecnicoId === filtros.tecnicoId)
      .map((m) => this.lectura(m));
  }

  async findDetail(id: number) {
    const meta = this.metas.find((m) => m.id === id);

    return meta ? this.lectura(meta) : null;
  }

  async tecnicoActivo(id: number) {
    return this.usuarios.some((u) => u.id === id && u.activo);
  }

  private copia(meta: MetaTicketEntity) {
    return MetaTicketEntity.hydrate(meta.toPrimitives());
  }

  private lectura(meta: MetaTicketEntity): MetaTicketReadModel {
    const { tecnicoId, id, ...resto } = meta.toPrimitives();

    return {
      ...resto,
      id: id!,
      tecnico: this.usuarios.find((u) => u.id === tecnicoId)!,
    };
  }
}

export class MetricaTicketFake implements MetricaTicketQueryPort {
  tickets: TicketPeriodoReadModel[] = [];
  ahora: SituacionTickets = {
    activos: 0,
    enProceso: 0,
    resueltosHoy: 0,
    asignadosHoy: 0,
  };

  constructor(
    private readonly usuarios: TecnicoMetrica[],
    /** Quiénes son técnicos (se listan aunque no tengan tickets). */
    private readonly tecnicosCampo: number[],
  ) {}

  async ticketsResueltos(p: {
    tecnicoIds: number[];
    desde: string;
    hasta: string;
  }) {
    return this.tickets.flatMap((t) =>
      t.diaCierre &&
      t.diaCierre >= p.desde &&
      t.diaCierre <= p.hasta &&
      t.tecnicoIds.some((id) => p.tecnicoIds.includes(id))
        ? [{ id: t.id, tecnicoIds: t.tecnicoIds, diaCierre: t.diaCierre }]
        : [],
    );
  }

  async ticketsDelPeriodo(p: { desde: string; hasta: string }) {
    const dentro = (dia: string | null) =>
      dia !== null && dia >= p.desde && dia <= p.hasta;

    return this.tickets.filter(
      (t) => dentro(t.diaApertura) || dentro(t.diaCierre),
    );
  }

  async tecnicos(incluirIds: number[]) {
    return this.usuarios.filter(
      (u) =>
        (u.activo && this.tecnicosCampo.includes(u.id)) ||
        incluirIds.includes(u.id),
    );
  }

  async situacion() {
    return this.ahora;
  }
}

export function crearBaseMetricas() {
  const usuarios: TecnicoMetrica[] = [
    { id: 1, nombre: 'Ana', activo: true },
    { id: 2, nombre: 'Beto', activo: true },
    { id: 3, nombre: 'Carla', activo: false },
    { id: 4, nombre: 'Dani', activo: true },
  ];
  const metas = new MetaTicketFake(usuarios);
  const tickets = new MetricaTicketFake(usuarios, [1, 2, 3]);
  const reloj = new RelojFijo('2026-07-10T18:00:00.000Z');
  const unidad = { ejecutar: <T>(trabajo: () => Promise<T>) => trabajo() };
  const avance = new AvanceMetasService(metas, tickets, reloj);

  return { metas, tickets, reloj, unidad, avance };
}

export function ticketResuelto(
  id: number,
  tecnicoIds: number[],
  diaCierre: string,
  diaApertura = diaCierre,
): TicketPeriodoReadModel {
  return { id, tecnicoIds, diaApertura, diaCierre, horasHastaCierre: 2 };
}
