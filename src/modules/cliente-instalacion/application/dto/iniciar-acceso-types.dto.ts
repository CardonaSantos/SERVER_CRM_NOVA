import { Transform } from 'class-transformer';

import { Equals, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

const toNumber = ({ value }: { value: unknown }): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
};

export enum ModoAccesoInstalacion {
  NUEVO = 'NUEVO',
  EXISTENTE = 'EXISTENTE',
}

/**
 * Clase base usada por class-transformer para resolver
 * el DTO concreto mediante la propiedad discriminadora `modo`.
 */
export abstract class AccesoInstalacionBaseDto {
  @IsEnum(ModoAccesoInstalacion)
  modo: ModoAccesoInstalacion;
}

/**
 * Datos necesarios cuando la instalación creará
 * un acceso de internet nuevo.
 */
export class CrearAccesoNuevoInstalacionDto extends AccesoInstalacionBaseDto {
  @Equals(ModoAccesoInstalacion.NUEVO)
  declare modo: ModoAccesoInstalacion.NUEVO;

  @IsEnum(TecnologiaAccesoInternet)
  tecnologia: TecnologiaAccesoInternet;

  @IsEnum(MetodoAutenticacionInternet)
  metodoAutenticacion: MetodoAutenticacionInternet;

  /**
   * Se valida como entero positivo cuando se proporciona.
   *
   * La regla que lo vuelve obligatorio para:
   * FIBRA_GPON + PPPOE
   *
   * permanecerá en el caso de uso, porque también depende
   * de servicioInternetId, que pertenece al DTO principal.
   */
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  mikrotikRouterId?: number;
}

/**
 * Datos necesarios cuando la instalación reutilizará
 * un acceso existente del cliente.
 */
export class VincularAccesoExistenteInstalacionDto extends AccesoInstalacionBaseDto {
  @Equals(ModoAccesoInstalacion.EXISTENTE)
  declare modo: ModoAccesoInstalacion.EXISTENTE;

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  accesoInternetId: number;
}

/**
 * Tipo utilizado internamente por el caso de uso.
 *
 * Después de la transformación y validación, TypeScript
 * podrá discriminarlo mediante `acceso.modo`.
 */
export type AccesoInstalacionInput =
  | CrearAccesoNuevoInstalacionDto
  | VincularAccesoExistenteInstalacionDto;
