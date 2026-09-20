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
    telefono: string | null;
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
