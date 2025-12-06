export interface nuevaSolicitud {
  id: number;
  productoId: number;
  precioSolicitado: number;
  solicitadoPorId: number;
  estado: string;
  aprobadoPorId: number | null;
  fechaSolicitud: Date;
  fechaRespuesta: Date | null;
}
