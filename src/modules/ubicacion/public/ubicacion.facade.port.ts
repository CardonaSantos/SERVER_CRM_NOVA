import { UbicacionAsignada } from './ubicacion.types';

export const UBICACION = Symbol('UBICACION');

export type VerificarUbicacionInput = {
  /** Cómo quedará el registro. */
  nueva: UbicacionAsignada;
  /** Cómo estaba; sin ella, todo se considera nuevo. */
  anterior?: UbicacionAsignada;
};

export interface UbicacionFacadePort {
  /**
   * Confirma lo que cambia de una ubicación. Llámala dentro de la unidad de
   * trabajo que asigna: el sector no podrá eliminarse ni cambiar de municipio
   * hasta que esta termine.
   * @throws DepartamentoNoEncontradoError | MunicipioNoEncontradoError |
   * SectorNoEncontradoError si algo no existe.
   * @throws SectorEliminadoError si el sector está eliminado.
   * @throws MunicipioDeOtroDepartamentoError | SectorDeOtroMunicipioError si
   * la combinación no cuadra.
   */
  verificarAsignacion(input: VerificarUbicacionInput): Promise<void>;
}
