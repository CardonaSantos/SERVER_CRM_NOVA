import { RolTecnicoOperacionCliente } from '../enums/rol-tecnico-operacion-cliente.enum';
import { ClienteInstalacionTecnicoInvalidoError } from '../errors/cliente-instalacion.errors';

export type TecnicoInstalacionEntrada = {
  tecnicoId: number;
  rol?: RolTecnicoOperacionCliente;
  esResponsable?: boolean;
  observaciones?: string | null;
};

export type TecnicoInstalacionAsignado = {
  tecnicoId: number;
  rol: RolTecnicoOperacionCliente;
  esResponsable: boolean;
  observaciones: string | null;
};

/**
 * Deja la lista de técnicos de una instalación lista para guardar:
 * sin repetidos, a lo sumo un responsable y con rol coherente.
 */
export function normalizarTecnicosInstalacion(
  entradas: readonly TecnicoInstalacionEntrada[],
): TecnicoInstalacionAsignado[] {
  const ids = entradas.map((tecnico) => tecnico.tecnicoId);

  if (new Set(ids).size !== ids.length) {
    throw new ClienteInstalacionTecnicoInvalidoError(
      'No se puede asignar el mismo técnico más de una vez.',
    );
  }

  const asignados = entradas.map((tecnico): TecnicoInstalacionAsignado => {
    const esResponsable =
      tecnico.esResponsable === true ||
      tecnico.rol === RolTecnicoOperacionCliente.RESPONSABLE;

    return {
      tecnicoId: tecnico.tecnicoId,
      rol: esResponsable
        ? RolTecnicoOperacionCliente.RESPONSABLE
        : (tecnico.rol ?? RolTecnicoOperacionCliente.APOYO),
      esResponsable,
      observaciones: tecnico.observaciones?.trim() || null,
    };
  });

  if (asignados.filter((tecnico) => tecnico.esResponsable).length > 1) {
    throw new ClienteInstalacionTecnicoInvalidoError(
      'Una instalación solo puede tener un técnico responsable.',
    );
  }

  return asignados;
}

export type TecnicoInstalacionActualizacion = {
  tecnicoId: number;
  rol: RolTecnicoOperacionCliente;
  esResponsable: boolean;
};

/**
 * Reglas de la lista completa de técnicos al editar una instalación: sin
 * repetidos y, si hay técnicos, exactamente un responsable con rol coherente.
 * Una lista vacía deja la instalación sin técnicos.
 */
export function validarTecnicosActualizacion(
  tecnicos: readonly TecnicoInstalacionActualizacion[],
): void {
  const ids = tecnicos.map((tecnico) => tecnico.tecnicoId);

  if (new Set(ids).size !== ids.length) {
    throw new ClienteInstalacionTecnicoInvalidoError(
      'No se puede asignar el mismo técnico más de una vez.',
    );
  }

  if (tecnicos.length === 0) {
    return;
  }

  if (tecnicos.filter((tecnico) => tecnico.esResponsable).length !== 1) {
    throw new ClienteInstalacionTecnicoInvalidoError(
      'La instalación debe tener exactamente un técnico responsable.',
    );
  }

  for (const tecnico of tecnicos) {
    const rolResponsable =
      tecnico.rol === RolTecnicoOperacionCliente.RESPONSABLE;

    if (tecnico.esResponsable && !rolResponsable) {
      throw new ClienteInstalacionTecnicoInvalidoError(
        `El técnico ${tecnico.tecnicoId} marcado como responsable debe tener rol RESPONSABLE.`,
      );
    }

    if (!tecnico.esResponsable && rolResponsable) {
      throw new ClienteInstalacionTecnicoInvalidoError(
        `El técnico ${tecnico.tecnicoId} con rol RESPONSABLE debe estar marcado como responsable.`,
      );
    }
  }
}
