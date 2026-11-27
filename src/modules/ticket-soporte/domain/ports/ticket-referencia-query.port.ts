export const TICKET_REFERENCIA_QUERY = Symbol('TICKET_REFERENCIA_QUERY');

export type ClienteDeAviso = {
  nombre: string;
  telefono: string | null;
  telefonoReferencia: string | null;
};

/** Lecturas de lo que un ticket referencia: clientes, usuarios y catálogos. */
export interface TicketReferenciaQueryPort {
  /** `null` si no existe o está eliminado. */
  clienteVigente(clienteId: number): Promise<ClienteDeAviso | null>;

  /** De los ids dados, los que son usuarios activos. */
  usuariosActivos(ids: number[]): Promise<number[]>;

  /** De los ids dados, las etiquetas no eliminadas. */
  etiquetasVigentes(ids: number[]): Promise<number[]>;

  /** Nombre de la solución, o `null` si no existe o está eliminada. */
  solucionVigente(id: number): Promise<string | null>;

  /** Nombres para la bitácora, incluidos los de registros ya eliminados. */
  nombresUsuarios(ids: number[]): Promise<Map<number, string>>;

  nombresEtiquetas(ids: number[]): Promise<Map<number, string>>;

  nombresClientes(ids: number[]): Promise<Map<number, string>>;
}
