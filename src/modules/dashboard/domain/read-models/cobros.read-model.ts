export type CobrosDashboardReadModel = {
  rutasActiva: Array<{
    id: number;
    nombreRuta: string;
    cobrador: string | null;
    totalClientes: number;
  }>;
  morosoTop: Array<{
    id: number;
    nombre: string;
    /** Facturas sin pagar. */
    cantidad: number;
  }>;
};
