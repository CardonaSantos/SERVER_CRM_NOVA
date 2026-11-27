export class SectorResponseDto {
  /** Id del sector */ id: number;
  /** Nombre */ nombre: string;
  /** Descripción */ descripcion: string | null;
  /** Municipio */ municipioId: number;
  /** Creación (ISO 8601) */ creadoEn: string;
  /** Última modificación (ISO 8601) */ actualizadoEn: string;
}

export class SectorListadoResponseDto {
  /** Id del sector */ id: number;
  /** Nombre */ nombre: string;
  /** Descripción */ descripcion: string | null;
  /** Municipio */ municipio: { id: number; nombre: string };
  /** Departamento */ departamento: { id: number; nombre: string };
  /** Creación (ISO 8601) */ creadoEn: string;
  /** Última modificación (ISO 8601) */ actualizadoEn: string;
  /** Clientes no eliminados del sector */ clientes: number;
  /** `true` si no tiene ningún cliente y puede eliminarse */
  eliminable: boolean;
}

export class SectorOpcionResponseDto {
  /** Id del sector */ id: number;
  /** Nombre */ nombre: string;
  /** Municipio */ municipioId: number;
  /** Clientes no eliminados del sector */ clientes: number;
}

export class SectorEliminadoResponseDto {
  /** Id del sector */ sectorId: number;
  /** Momento del borrado (ISO 8601) */ eliminadoEn: string;
}
