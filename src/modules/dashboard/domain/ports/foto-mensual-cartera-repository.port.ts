import { FotoMensualCarteraEntity } from '../entities/foto-mensual-cartera.entity';

export const FOTO_MENSUAL_CARTERA_REPOSITORY = Symbol(
  'FOTO_MENSUAL_CARTERA_REPOSITORY',
);

export interface FotoMensualCarteraRepositoryPort {
  /**
   * Guarda la foto si su mes todavía no tiene una. Devuelve `false` si ya
   * existía: la foto de un mes nunca se reemplaza.
   */
  guardarSiNoExiste(foto: FotoMensualCarteraEntity): Promise<boolean>;
}
