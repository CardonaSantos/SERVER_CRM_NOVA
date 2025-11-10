// src/modules/reports/domain/repositories/clientes-internet.query-repo.ts
export interface ClientesInternetQueryRepo {
  findClientes(params: {
    desde?: Date;
    hasta?: Date;
    sectorId?: number;
    planId?: number; // o servicioInternetId si ese es tu nombre real
    activos?: boolean;
  }): Promise<
    Array<{
      id: string;
      nombre: string;
      telefono?: string | null;
      fechaAlta: Date;
      plan: string;
      estado: string;
      saldo: number;
    }>
  >;
}
