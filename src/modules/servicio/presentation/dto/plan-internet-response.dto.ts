import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';

export class PlanInternetResponseDto {
  /** Id del plan */ id: number;
  /** Nombre */ nombre: string;
  /** Velocidad anunciada */ velocidad: string | null;
  /** Precio mensual */ precio: number;
  /** `ACTIVO` o `INACTIVO` */ estado: EstadoServicio;
  /** Creación (ISO 8601) */ creadoEn: string;
  /** Última modificación (ISO 8601) */ actualizadoEn: string;
}

export class PlanInternetListadoResponseDto extends PlanInternetResponseDto {
  /** Clientes no eliminados con el plan */ clientes: number;
  /** `true` si nunca se usó y puede eliminarse */ eliminable: boolean;
}

export class UsoPlanInternetResponseDto {
  /** Clientes eliminados que lo tenían */ clientesEliminados: number;
  /** Accesos de internet */ accesos: number;
  /** Instalaciones */ instalaciones: number;
  /** Desinstalaciones */ desinstalaciones: number;
  /** Homologaciones PPPoE */ homologaciones: number;
}

export class PlanInternetDetalleResponseDto extends PlanInternetListadoResponseDto {
  /** Clientes a los que se les factura */ clientesFacturables: number;
  /** Por qué no puede eliminarse, además de sus clientes */
  uso: UsoPlanInternetResponseDto;
}

export class PlanInternetOpcionResponseDto {
  /** Id del plan */ id: number;
  /** Nombre */ nombre: string;
  /** Velocidad anunciada */ velocidad: string | null;
  /** Precio mensual */ precio: number;
  /** Solo los `ACTIVO` admiten asignaciones nuevas */ estado: EstadoServicio;
}

export class PrecioPlanInternetResponseDto {
  /** Id del plan */ planId: number;
  /** Precio anterior */ precioAnterior: number;
  /** Precio vigente */ precioNuevo: number;
  /** Clientes no eliminados con el plan */ clientesAfectados: number;
  /** De ellos, a cuántos se les factura */ clientesFacturables: number;
}

export class PlanInternetEliminadoResponseDto {
  /** Id del plan */ planId: number;
  /** Momento del borrado (ISO 8601) */ eliminadoEn: string;
}
