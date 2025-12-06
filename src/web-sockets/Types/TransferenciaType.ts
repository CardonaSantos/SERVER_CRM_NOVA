export interface solicitudTransferencia {
  id: number;
  productoId: number;
  cantidad: number;
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  usuarioSolicitanteId: number | null;
  estado: string;
  fechaSolicitud: Date;
  fechaAprobacion: Date | null;
  administradorId: number | null;
}
