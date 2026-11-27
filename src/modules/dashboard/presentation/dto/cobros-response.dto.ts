export class CobrosResponseDto {
  /** Rutas de cobro abiertas */
  rutasActiva: Array<{
    id: number;
    nombreRuta: string;
    cobrador: string;
    totalClientes: number;
  }>;
  /** Clientes con más facturas sin pagar */
  morosoTop: Array<{ id: number; nombre: string; cantidad: number }>;
}
