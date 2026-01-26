export class CreateCuotasPagoDto {
  cuotaId: number;
  monto: number;
  creditoId: number;

  fechaPago: Date;
  metodoPago: string;
  referencia: string;
  observacion: string;
}
