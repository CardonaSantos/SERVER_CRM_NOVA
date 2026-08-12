export interface TicketConformidadPublicReadModel {
  ticket: {
    id: number;

    titulo: string | null;
    descripcion: string | null;

    fechaApertura: Date;
    fechaResolucionTecnico: Date | null;
  };

  cliente: {
    nombreCompleto: string;
  } | null;

  tecnico: {
    nombre: string;
  } | null;

  conformidad: {
    resultado: string;

    creadoEn: Date;

    expiraEn: Date;
  };
}
