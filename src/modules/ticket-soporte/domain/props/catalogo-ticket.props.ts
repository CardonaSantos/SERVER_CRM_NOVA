export type EtiquetaTicketProps = {
  id: number | null;
  nombre: string;
  eliminadoEn: Date | null;
  eliminadoPorId: number | null;
};

export type SolucionTicketProps = {
  id: number | null;
  nombre: string;
  descripcion: string | null;
  eliminada: boolean;
};
