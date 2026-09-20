import { Prisma } from '@prisma/client';

/**
 * Select canónico del reporte V1 de tickets.
 *
 * REGLA:
 * 1 TicketSoporte = 1 resultado raíz.
 *
 * Las relaciones 1:N permanecen anidadas y serán
 * consolidadas posteriormente por el mapper.
 */
export const selectTicketSoporteReport =
  Prisma.validator<Prisma.TicketSoporteSelect>()({
    // TICKET

    id: true,

    titulo: true,
    descripcion: true,

    estado: true,
    prioridad: true,

    // ===================================================
    // CICLO
    // ===================================================

    fechaApertura: true,
    fechaAsignacion: true,
    fechaInicioAtencion: true,
    fechaResolucionTecnico: true,
    fechaCierre: true,

    // ===================================================
    // CLIENTE
    // ===================================================

    clienteId: true,

    cliente: {
      select: {
        id: true,
        nombre: true,
        apellidos: true,
      },
    },

    // ===================================================
    // CREADOR
    // ===================================================

    creadoPorId: true,

    creadoPor: {
      select: {
        id: true,
        nombre: true,
      },
    },

    // ===================================================
    // TÉCNICO PRINCIPAL
    // ===================================================

    tecnicoId: true,

    tecnico: {
      select: {
        id: true,
        nombre: true,
      },
    },

    // ===================================================
    // TÉCNICOS ADICIONALES
    // ===================================================

    asignaciones: {
      select: {
        tecnicoId: true,

        tecnico: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    },

    // ===================================================
    // ETIQUETAS
    // ===================================================

    etiquetas: {
      select: {
        etiquetaId: true,

        etiqueta: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    },

    // ===================================================
    // TELEMETRÍA TÉCNICA
    // ===================================================

    logsTiempo: {
      select: {
        id: true,

        inicio: true,
        fin: true,

        duracionMinutos: true,
      },

      orderBy: {
        inicio: 'asc',
      },
    },

    // ===================================================
    // RESUMEN / SOLUCIÓN
    // ===================================================

    resumen: {
      select: {
        solucionId: true,

        resueltoComo: true,
        notasInternas: true,

        tiempoTotalMinutos: true,
        tiempoTecnicoMinutos: true,

        solucion: {
          select: {
            id: true,
            solucion: true,
          },
        },
      },
    },
  });

export type TicketReportePrismaResult = Prisma.TicketSoporteGetPayload<{
  select: typeof selectTicketSoporteReport;
}>;
