export type MikrotikRouterConnectionContext = {
  routerId: number;

  host: string;

  port: number;

  username: string;

  /**
   * Solo debe permanecer en memoria
   * durante la sesión SSH.
   */
  password: string;
};

export interface MikrotikRouterConnectionContextPort {
  resolve(routerId: number): Promise<MikrotikRouterConnectionContext>;
}
