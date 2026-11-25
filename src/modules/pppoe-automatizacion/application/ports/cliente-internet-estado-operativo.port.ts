export enum EstadoOperativoClienteInternet {
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
}

export type SincronizarEstadoOperativoClienteParams = {
  empresaId: number;

  clienteId: number;

  estado: EstadoOperativoClienteInternet;

  cambiadoPorId?: number | null;

  motivo?: string | null;

  descripcion?: string | null;
};

export interface ClienteInternetEstadoOperativoPort {
  sincronizar(params: SincronizarEstadoOperativoClienteParams): Promise<void>;
}

export const CLIENTE_INTERNET_ESTADO_OPERATIVO = Symbol(
  'CLIENTE_INTERNET_ESTADO_OPERATIVO',
);
