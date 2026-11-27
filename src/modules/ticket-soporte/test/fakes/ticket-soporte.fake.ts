import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import type {
  RegistrarActualizacionTicketInput,
  RegistrarEventoTicketHistorialInput,
} from 'src/modules/ticket-soporte-historial/public/ticket-soporte-historial.facade.port';
import { AccesoTicketService } from '../../application/services/acceso-ticket.service';
import { ReferenciasTicketService } from '../../application/services/referencias-ticket.service';
import { TransicionTicketService } from '../../application/services/transicion-ticket.service';
import { ComentarioTicketEntity } from '../../domain/entities/comentario-ticket.entity';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import { CicloTrabajo } from '../../domain/policies/tiempos-ticket.policy';
import { ComentarioTicketRepositoryPort } from '../../domain/ports/comentario-ticket-repository.port';
import { TicketReferenciaQueryPort } from '../../domain/ports/ticket-referencia-query.port';
import {
  CerrarResumenParams,
  TicketRepositoryPort,
} from '../../domain/ports/ticket-repository.port';
import { TicketProps } from '../../domain/props/ticket.props';

/** Devuelve copias, como una base de datos. */
export class TicketRepositoryFake implements TicketRepositoryPort {
  readonly tickets = new Map<number, TicketProps>();
  readonly relojes = new Map<number, Array<CicloTrabajo & { por: number }>>();
  readonly resumenes = new Map<
    number,
    { numeroReaperturas: number; cierre?: CerrarResumenParams }
  >();
  private siguiente = 1;
  private siguienteCiclo = 1;

  async findById(id: number) {
    const props = this.tickets.get(id);

    return props ? TicketEntity.hydrate(props) : null;
  }

  bloquear(id: number) {
    return this.findById(id);
  }

  async create(ticket: TicketEntity) {
    const props = { ...ticket.toPrimitives(), id: this.siguiente++ };
    this.tickets.set(props.id, props);

    return TicketEntity.hydrate(props);
  }

  async update(ticket: TicketEntity) {
    this.tickets.set(ticket.id!, ticket.toPrimitives());

    return TicketEntity.hydrate(ticket.toPrimitives());
  }

  async ciclos(ticketId: number) {
    return (this.relojes.get(ticketId) ?? []).map((ciclo) => ({ ...ciclo }));
  }

  async abrirCiclo(ticketId: number, tecnicoId: number, inicio: Date) {
    const lista = this.relojes.get(ticketId) ?? [];
    lista.push({
      id: this.siguienteCiclo++,
      inicio,
      fin: null,
      duracionMinutos: null,
      por: tecnicoId,
    });
    this.relojes.set(ticketId, lista);
  }

  async cerrarCiclo(cicloId: number, fin: Date, minutos: number) {
    for (const lista of this.relojes.values()) {
      const ciclo = lista.find((c) => c.id === cicloId);
      if (ciclo) Object.assign(ciclo, { fin, duracionMinutos: minutos });
    }
  }

  async reaperturas(ticketId: number) {
    return this.resumenes.get(ticketId)?.numeroReaperturas ?? 0;
  }

  async cerrarResumen(params: CerrarResumenParams) {
    this.resumenes.set(params.ticketId, {
      numeroReaperturas: await this.reaperturas(params.ticketId),
      cierre: params,
    });
  }

  async registrarReapertura(ticketId: number) {
    this.resumenes.set(ticketId, {
      ...this.resumenes.get(ticketId),
      numeroReaperturas: (await this.reaperturas(ticketId)) + 1,
    });
  }
}

export class TicketReferenciaQueryFake implements TicketReferenciaQueryPort {
  clientes = new Set([10]);
  usuarios = new Set([1, 2, 3]);
  etiquetas = new Set([100, 101]);
  soluciones = new Map([[7, 'Cambio de router']]);

  async clienteVigente(id: number) {
    return this.clientes.has(id)
      ? {
          nombre: 'Cliente Uno',
          telefono: '50000000',
          telefonoReferencia: null,
        }
      : null;
  }

  async usuariosActivos(ids: number[]) {
    return ids.filter((id) => this.usuarios.has(id));
  }

  async etiquetasVigentes(ids: number[]) {
    return ids.filter((id) => this.etiquetas.has(id));
  }

  async solucionVigente(id: number) {
    return this.soluciones.get(id) ?? null;
  }

  async nombresUsuarios(ids: number[]) {
    return new Map(ids.map((id) => [id, `Usuario ${id}`]));
  }

  async nombresEtiquetas(ids: number[]) {
    return new Map(ids.map((id) => [id, `Etiqueta ${id}`]));
  }

  async nombresClientes(ids: number[]) {
    return new Map(ids.map((id) => [id, `Cliente ${id}`]));
  }
}

export class ComentarioTicketRepositoryFake
  implements ComentarioTicketRepositoryPort
{
  readonly guardados = new Map<
    number,
    { comentario: ComentarioTicketEntity; mediaIds: number[] }
  >();
  fallar = false;
  private siguiente = 1;

  async create(comentario: ComentarioTicketEntity, mediaIds: number[]) {
    if (this.fallar) throw new Error('base caída');

    const guardado = ComentarioTicketEntity.hydrate({
      ...comentario.toPrimitives(),
      id: this.siguiente++,
    });
    this.guardados.set(guardado.id!, { comentario: guardado, mediaIds });

    return guardado;
  }

  async findById(id: number) {
    const registro = this.guardados.get(id);

    return registro
      ? ComentarioTicketEntity.hydrate(registro.comentario.toPrimitives())
      : null;
  }

  async marcarEliminado(comentario: ComentarioTicketEntity) {
    this.guardados.get(comentario.id!)!.comentario = comentario;
  }
}

/** Todas las piezas de un caso de uso de tickets, con dobles en memoria. */
export function armarTickets() {
  const reloj = new RelojFijo('2026-11-27T15:00:00.000Z');
  const tickets = new TicketRepositoryFake();
  const consultas = new TicketReferenciaQueryFake();
  // Devuelven el ticket como id de la entrada: solo importa lo que reciben.
  const historial = {
    registrarEvento: jest.fn((input: RegistrarEventoTicketHistorialInput) =>
      Promise.resolve(input.ticketId),
    ),
    registrarActualizacion: jest.fn(
      (input: RegistrarActualizacionTicketInput) =>
        Promise.resolve(input.ticketId),
    ),
  };
  const avisos = {
    asignacion: jest.fn(async () => undefined),
    cambioEstado: jest.fn(async () => undefined),
    clienteTicketCreado: jest.fn(async () => undefined),
    ticketDelBot: jest.fn(async () => undefined),
  };
  const metas = { sumarResuelto: jest.fn(async () => undefined) };
  const unidad = { ejecutar: <T>(trabajo: () => Promise<T>) => trabajo() };
  const referencias = new ReferenciasTicketService(consultas);
  const acceso = new AccesoTicketService(tickets);
  const transicion = new TransicionTicketService(
    tickets,
    consultas,
    historial,
    avisos,
    unidad,
    reloj,
  );

  return {
    reloj,
    tickets,
    consultas,
    historial,
    avisos,
    metas,
    unidad,
    referencias,
    acceso,
    transicion,
    /** Guarda un ticket de la empresa 1 listo para usar. */
    async sembrar(datos: Partial<Parameters<typeof TicketEntity.create>[0]>) {
      const creado = await tickets.create(
        TicketEntity.create(
          { empresaId: 1, titulo: 'Sin señal', ...datos },
          reloj.ahora(),
        ),
      );

      return creado.id!;
    },
  };
}

export const OFICINA = {
  usuarioId: 9,
  usuarioNombre: 'Oficina',
  gestiona: true,
};

export const TECNICO = {
  usuarioId: 1,
  usuarioNombre: 'Técnico',
  gestiona: false,
};
