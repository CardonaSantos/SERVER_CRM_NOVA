import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';

export class ServicioAdicionalResponseDto {
  /** Id del servicio */ id: number;
  /** Nombre */ nombre: string;
  /** Descripción */ descripcion: string | null;
  /** Precio */ precio: number;
  /** `ACTIVO` o `INACTIVO` */ estado: EstadoServicio;
  /** Tipo */ tipoServicioId: number | null;
  /** Creación (ISO 8601) */ creadoEn: string;
  /** Última modificación (ISO 8601) */ actualizadoEn: string;
}

export class ServicioAdicionalListadoResponseDto {
  /** Id del servicio */ id: number;
  /** Nombre */ nombre: string;
  /** Descripción */ descripcion: string | null;
  /** Precio */ precio: number;
  /** `ACTIVO` o `INACTIVO` */ estado: EstadoServicio;
  /** Tipo */ tipo: { id: number; nombre: string } | null;
  /** Creación (ISO 8601) */ creadoEn: string;
  /** Última modificación (ISO 8601) */ actualizadoEn: string;
  /** Asignaciones a clientes no eliminados */ clientes: number;
  /** `true` si nunca se usó y puede eliminarse */ eliminable: boolean;
}

export class ServicioAdicionalOpcionResponseDto {
  /** Id del servicio */ id: number;
  /** Nombre */ nombre: string;
  /** Precio */ precio: number;
  /** Solo los `ACTIVO` admiten asignaciones nuevas */ estado: EstadoServicio;
}

export class ServicioAdicionalEliminadoResponseDto {
  /** Id del servicio */ servicioId: number;
  /** Momento del borrado (ISO 8601) */ eliminadoEn: string;
}
