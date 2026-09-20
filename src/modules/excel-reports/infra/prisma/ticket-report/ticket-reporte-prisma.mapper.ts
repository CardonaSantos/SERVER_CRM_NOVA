import { type TicketReporteEstado as TicketReporteEstadoType } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-report-estado';
import { type TicketReportePrioridad as TicketReportePrioridadType } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-reporte-prioridad.enum';
import {
  TicketReporteEtiqueta,
  TicketReporteParticipante,
  TicketReporteRow,
} from 'src/modules/excel-reports/domain/read-models/tickets-reporte/ticket-reporte-row';
import { TicketReportePrismaResult } from './ticket-reporte-selects.query';
import { TicketReporteEstado } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-report-estado';
import { TicketReportePrioridad } from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-reporte-prioridad.enum';

export class TicketReportePrismaMapper {
  static toRow(ticket: TicketReportePrismaResult): TicketReporteRow {
    const tecnicoPrincipal = this.buildTecnicoPrincipal(ticket);

    const tecnicosApoyo = this.buildTecnicosApoyo(
      ticket,
      tecnicoPrincipal?.tecnicoId ?? null,
    );

    const participantes = this.buildParticipantes(
      tecnicoPrincipal,
      tecnicosApoyo,
    );

    const etiquetas = this.buildEtiquetas(ticket);

    const tiempoTecnicoRegistradoMinutos = this.sumTiempoTecnico(ticket);

    return {
      // =================================================
      // IDENTIDAD
      // =================================================

      ticketId: ticket.id,

      titulo: ticket.titulo,
      descripcion: ticket.descripcion,

      estado: this.mapEstado(ticket.estado),

      prioridad: this.mapPrioridad(ticket.prioridad),

      // =================================================
      // CLIENTE
      // =================================================

      clienteId: ticket.clienteId,

      clienteNombre: ticket.cliente
        ? this.buildNombreCliente(
            ticket.cliente.nombre,
            ticket.cliente.apellidos,
          )
        : null,

      // =================================================
      // CREADOR
      // =================================================

      creadoPorId: ticket.creadoPorId,

      creadoPorNombre: ticket.creadoPor?.nombre ?? null,

      // =================================================
      // TÉCNICOS
      // =================================================

      tecnicoPrincipalId: tecnicoPrincipal?.tecnicoId ?? null,

      tecnicoPrincipalNombre: tecnicoPrincipal?.nombre ?? null,

      tecnicosApoyo,

      participantes,

      totalParticipantes: participantes.length,

      // =================================================
      // ETIQUETAS
      // =================================================

      etiquetas,

      // =================================================
      // CICLO
      // =================================================

      fechaApertura: ticket.fechaApertura,

      fechaAsignacion: ticket.fechaAsignacion,

      fechaInicioAtencion: ticket.fechaInicioAtencion,

      fechaResolucionTecnico: ticket.fechaResolucionTecnico,

      fechaCierre: ticket.fechaCierre,

      // =================================================
      // TIEMPOS
      // =================================================

      tiempoHastaAsignacionMinutos: this.diffMinutos(
        ticket.fechaApertura,
        ticket.fechaAsignacion,
      ),

      tiempoHastaPrimeraAtencionMinutos: this.diffMinutos(
        ticket.fechaApertura,
        ticket.fechaInicioAtencion,
      ),

      tiempoHastaResolucionTecnicaMinutos: this.diffMinutos(
        ticket.fechaApertura,
        ticket.fechaResolucionTecnico,
      ),

      /**
       * Fuente canónica V1:
       * SUM TicketTimeLog.duracionMinutos.
       *
       * No utilizamos aquí
       * resumen.tiempoTecnicoMinutos porque los
       * TicketTimeLog son la telemetría fuente.
       */
      tiempoTecnicoRegistradoMinutos,

      /**
       * Este valor sí puede reconstruirse de forma
       * determinista:
       *
       * fechaApertura -> fechaCierre.
       *
       * Esto además evita depender de resúmenes legacy
       * que pudieron haberse creado con la semántica
       * anterior.
       */
      tiempoTotalMinutos: this.diffMinutos(
        ticket.fechaApertura,
        ticket.fechaCierre,
      ),

      ciclosTecnicos: ticket.logsTiempo.length,

      // =================================================
      // RESOLUCIÓN
      // =================================================

      solucionId: ticket.resumen?.solucionId ?? null,

      solucionNombre: ticket.resumen?.solucion?.solucion ?? null,

      resueltoComo: ticket.resumen?.resueltoComo ?? null,

      notasInternas: ticket.resumen?.notasInternas ?? null,
    };
  }

  // ===================================================
  // PARTICIPANTES
  // ===================================================

  private static buildTecnicoPrincipal(
    ticket: TicketReportePrismaResult,
  ): TicketReporteParticipante | null {
    if (!ticket.tecnico) {
      return null;
    }

    return {
      tecnicoId: ticket.tecnico.id,

      nombre: ticket.tecnico.nombre,

      tipo: 'PRINCIPAL',
    };
  }

  private static buildTecnicosApoyo(
    ticket: TicketReportePrismaResult,
    tecnicoPrincipalId: number | null,
  ): TicketReporteParticipante[] {
    const map = new Map<number, TicketReporteParticipante>();

    for (const asignacion of ticket.asignaciones) {
      const tecnicoId = asignacion.tecnico.id;

      /**
       * Si por datos legacy el técnico principal también
       * aparece en TicketSoporteTecnico, PRINCIPAL gana.
       */
      if (tecnicoId === tecnicoPrincipalId) {
        continue;
      }

      if (map.has(tecnicoId)) {
        continue;
      }

      map.set(tecnicoId, {
        tecnicoId,

        nombre: asignacion.tecnico.nombre,

        tipo: 'APOYO',
      });
    }

    return [...map.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es'),
    );
  }

  private static buildParticipantes(
    tecnicoPrincipal: TicketReporteParticipante | null,
    tecnicosApoyo: TicketReporteParticipante[],
  ): TicketReporteParticipante[] {
    const map = new Map<number, TicketReporteParticipante>();

    if (tecnicoPrincipal) {
      map.set(tecnicoPrincipal.tecnicoId, tecnicoPrincipal);
    }

    for (const tecnico of tecnicosApoyo) {
      if (!map.has(tecnico.tecnicoId)) {
        map.set(tecnico.tecnicoId, tecnico);
      }
    }

    return [...map.values()];
  }

  // ===================================================
  // ETIQUETAS
  // ===================================================

  private static buildEtiquetas(
    ticket: TicketReportePrismaResult,
  ): TicketReporteEtiqueta[] {
    const map = new Map<number, TicketReporteEtiqueta>();

    for (const item of ticket.etiquetas) {
      if (map.has(item.etiqueta.id)) {
        continue;
      }

      map.set(item.etiqueta.id, {
        id: item.etiqueta.id,

        nombre: item.etiqueta.nombre,
      });
    }

    return [...map.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es'),
    );
  }

  // ===================================================
  // TIEMPOS
  // ===================================================

  private static sumTiempoTecnico(
    ticket: TicketReportePrismaResult,
  ): number | null {
    const duraciones = ticket.logsTiempo
      .map((log) => log.duracionMinutos)
      .filter(
        (value): value is number => value !== null && Number.isFinite(value),
      );

    /**
     * No existen ciclos con una duración
     * consolidada.
     *
     * Puede significar:
     *
     * - no hay TicketTimeLog;
     * - únicamente existe un ciclo abierto;
     * - datos históricos sin duración registrada.
     *
     * En cualquiera de esos casos no debemos
     * afirmar que el tiempo fue 0.
     */
    if (duraciones.length === 0) {
      return null;
    }

    return duraciones.reduce((total, duracion) => total + duracion, 0);
  }

  private static diffMinutos(desde: Date, hasta: Date | null): number | null {
    if (!hasta) {
      return null;
    }

    const diffMs = hasta.getTime() - desde.getTime();

    /**
     * Si existe un dato legacy incoherente no
     * fabricamos un tiempo negativo.
     */
    if (diffMs < 0) {
      return null;
    }

    return Math.floor(diffMs / 60_000);
  }

  // ===================================================
  // CLIENTE
  // ===================================================

  private static buildNombreCliente(
    nombre: string,
    apellidos: string | null,
  ): string {
    return [nombre, apellidos]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(' ')
      .trim();
  }

  // ===================================================
  // ENUMS
  // ===================================================

  private static mapEstado(value: string): TicketReporteEstadoType {
    const estados = Object.values(TicketReporteEstado) as string[];

    if (!estados.includes(value)) {
      throw new Error(`Estado de ticket no soportado por el reporte: ${value}`);
    }

    return value as TicketReporteEstadoType;
  }

  private static mapPrioridad(value: string): TicketReportePrioridadType {
    const prioridades = Object.values(TicketReportePrioridad) as string[];

    if (!prioridades.includes(value)) {
      throw new Error(
        `Prioridad de ticket no soportada por el reporte: ${value}`,
      );
    }

    return value as TicketReportePrioridadType;
  }
}
