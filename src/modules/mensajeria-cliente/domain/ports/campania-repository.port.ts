import { CampaniaEntity } from '../entities/campania.entity';
import { EstadoEnvio, MotivoEnvio } from '../enums/campania.enum';
import { DestinoCampania } from '../policies/destinatarios.policy';

export const CAMPANIA_REPOSITORY = Symbol('CAMPANIA_REPOSITORY');

export type EnvioReclamado = { id: number; telefono: string };

export type ResultadoEnvio = {
  estado: EstadoEnvio;
  motivo?: MotivoEnvio | null;
  detalle?: string | null;
  mensajeProveedorId?: string | null;
};

export interface CampaniaRepositoryPort {
  /**
   * Guarda la campaña con sus destinos solo si no hay otra enviándose
   * (atómico). Las detenidas pasan a interrumpidas. Devuelve el id.
   */
  crear(
    campania: CampaniaEntity,
    destinos: DestinoCampania[],
    ahora: Date,
  ): Promise<number>;

  findById(id: number): Promise<CampaniaEntity | null>;

  /**
   * Guarda una campaña reanudada si sigue detenida y no hay otra enviándose.
   * Lo que quedó a medias pasa a `SIN_CONFIRMAR`.
   */
  reanudar(campania: CampaniaEntity, ahora: Date): Promise<void>;

  /**
   * Toma el siguiente destino pendiente y lo marca `ENVIANDO`: nadie más lo
   * puede tomar. Null si no quedan o la campaña ya no está en curso.
   */
  tomarSiguiente(
    campaniaId: number,
    ahora: Date,
  ): Promise<EnvioReclamado | null>;

  /** Guarda cómo terminó un destino que estaba `ENVIANDO`. */
  registrarResultado(envioId: number, resultado: ResultadoEnvio): Promise<void>;

  interrumpir(campaniaId: number, ahora: Date): Promise<void>;

  /** La da por completada si no queda nada pendiente. */
  completar(campaniaId: number, ahora: Date): Promise<void>;
}
