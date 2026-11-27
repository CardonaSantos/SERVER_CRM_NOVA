import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';

export class TipoServicioResponseDto {
  /** Id del tipo */ id: number;
  /** Nombre */ nombre: string;
  /** Descripción */ descripcion: string | null;
  /** `ACTIVO` o `INACTIVO` */ estado: EstadoServicio;
  /** Creación (ISO 8601) */ creadoEn: string;
  /** Última modificación (ISO 8601) */ actualizadoEn: string;
}
