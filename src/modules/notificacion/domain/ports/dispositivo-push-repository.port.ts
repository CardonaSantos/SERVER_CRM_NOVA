export const DISPOSITIVO_PUSH_REPOSITORY = Symbol(
  'DISPOSITIVO_PUSH_REPOSITORY',
);

export type RegistroDispositivoPush = {
  usuarioId: number;
  /** Sesión que lo registró: al revocarse, el dispositivo deja de recibir. */
  sesionId: string;
  instalacionId: string;
  token: string;
  nombreDispositivo: string | null;
  modeloDispositivo: string | null;
  versionApp: string | null;
  fecha: Date;
};

export type DispositivoPushRegistrado = {
  instalacionId: string;
  plataforma: string;
  activo: boolean;
  registradoEn: Date;
};

export type PreferenciasPush = { push: boolean; sonido: boolean };

export interface DispositivoPushRepositoryPort {
  /**
   * Registra o refresca la instalación (idempotente por `instalacionId`): la
   * deja activa, a nombre del usuario y de la sesión que la presenta. Si el
   * token estaba en otra instalación, esa asociación se borra.
   */
  registrar(
    registro: RegistroDispositivoPush,
  ): Promise<DispositivoPushRegistrado>;

  /** Desactiva la instalación solo si está a nombre del usuario. `false` si no había nada activo. */
  revocar(
    usuarioId: number,
    instalacionId: string,
    fecha: Date,
  ): Promise<boolean>;

  /** Desactiva los dispositivos registrados por esas sesiones. Devuelve cuántos. */
  revocarPorSesiones(
    sesionIds: readonly string[],
    fecha: Date,
  ): Promise<number>;

  tokensActivos(usuarioId: number): Promise<string[]>;

  /** Desactiva tokens que el proveedor rechazó. Devuelve cuántos. */
  desactivarTokens(tokens: readonly string[], fecha: Date): Promise<number>;

  /** Preferencias del perfil; sin perfil, ambas activas. */
  preferencias(usuarioId: number): Promise<PreferenciasPush>;
}
