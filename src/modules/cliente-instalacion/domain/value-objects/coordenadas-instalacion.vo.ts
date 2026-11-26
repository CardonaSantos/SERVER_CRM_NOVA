import { ClienteInstalacionDatosInvalidosError } from '../errors/cliente-instalacion.errors';

/** Par latitud/longitud de la dirección de instalación. */
export class CoordenadasInstalacion {
  private constructor(
    readonly latitud: number,
    readonly longitud: number,
  ) {}

  /** Texto `"latitud, longitud"`; vacío o ausente significa sin coordenadas. */
  static desdeTexto(valor?: string | null): CoordenadasInstalacion | null {
    if (!valor?.trim()) {
      return null;
    }

    const partes = valor.split(',').map((parte) => parte.trim());

    if (partes.length !== 2) {
      throw new ClienteInstalacionDatosInvalidosError(
        'Las coordenadas deben tener el formato "latitud, longitud".',
      );
    }

    const latitud = Number(partes[0]);
    const longitud = Number(partes[1]);

    if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
      throw new ClienteInstalacionDatosInvalidosError(
        'Las coordenadas proporcionadas no son válidas.',
      );
    }

    if (latitud < -90 || latitud > 90) {
      throw new ClienteInstalacionDatosInvalidosError(
        'La latitud debe estar entre -90 y 90.',
      );
    }

    if (longitud < -180 || longitud > 180) {
      throw new ClienteInstalacionDatosInvalidosError(
        'La longitud debe estar entre -180 y 180.',
      );
    }

    return new CoordenadasInstalacion(latitud, longitud);
  }

  equals(otra: CoordenadasInstalacion): boolean {
    return this.latitud === otra.latitud && this.longitud === otra.longitud;
  }
}
