/** Lo que facturación necesita saber de un cliente para emitirle una factura. */
export type ClienteFacturable = {
  clienteId: number;
  empresaId: number | null;
  nombre: string;
  apellidos: string | null;
  estadoCliente: string;
  isEliminado: boolean;
  desinstaladoEn: Date | null;
  zona: { id: number; diaPago: number } | null;
  plan: { nombre: string; precio: number } | null;
};

export type PlanPrimeraFactura = {
  diaPago: number;
  nombre: string;
  velocidad: string | null;
  precio: number;
};
