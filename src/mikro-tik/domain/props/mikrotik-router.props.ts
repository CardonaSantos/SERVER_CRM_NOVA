export type CrearMikrotikRouterEntityProps = {
  empresaId: number;

  nombre: string;
  host: string;
  sshPort?: number;
  usuario: string;

  descripcion?: string | null;
  activo?: boolean;

  oltId?: number | null;

  /**
   * Credencial ya protegida.
   *
   * La entidad nunca recibe la contraseña plana.
   */
  passwordEnc: string;
};

export type ActualizarMikrotikRouterEntityProps = {
  nombre?: string;
  host?: string;
  sshPort?: number;
  usuario?: string;

  descripcion?: string | null;
  activo?: boolean;

  oltId?: number | null;

  /**
   * Solo se envía cuando se sustituye
   * la credencial administrativa.
   */
  passwordEnc?: string;
};

export type MikrotikRouterEntityProps = {
  id: number | null;

  empresaId: number;

  nombre: string;
  host: string;
  sshPort: number;
  usuario: string;

  descripcion: string | null;
  activo: boolean;

  oltId: number | null;

  passwordEnc: string | null;

  creadoEn: Date;
  actualizadoEn: Date;
};
