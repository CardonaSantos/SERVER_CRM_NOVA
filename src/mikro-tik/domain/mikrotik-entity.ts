// MikrotikRouter.entity.ts

export interface MikrotikRouterProps {
  id?: number; // lo genera la BD
  passwordEnc: string | null;
  nombre: string;
  host: string;
  sshPort: number;
  usuario: string;
  descripcion?: string;
  activo: boolean;
  empresaId: number;
  oltId?: number | null;
  creadoEn: Date;
  actualizadoEn: Date;
}

export class MikrotikRouter {
  private constructor(private readonly props: MikrotikRouterProps) {}

  //  para crear la entidad en dominio
  static create(params: {
    passwordEnc: string;
    nombre: string;
    host: string;
    sshPort: number;
    usuario: string;
    empresaId: number;
    descripcion?: string;
    activo?: boolean;
    oltId?: number | null;
    id?: number;
    creadoEn?: Date;
    actualizadoEn?: Date;
  }): MikrotikRouter {
    const {
      nombre,
      host,
      sshPort,
      usuario,
      empresaId,
      descripcion,
      activo = true,
      oltId,
      id,
      creadoEn,
      actualizadoEn,
      passwordEnc,
    } = params;

    if (!nombre?.trim()) {
      throw new Error('El nombre del Mikrotik es requerido');
    }

    if (!host?.trim()) {
      throw new Error('El host del Mikrotik es requerido');
    }

    if (sshPort <= 0) {
      throw new Error('El puerto SSH debe ser mayor a 0');
    }

    if (!empresaId) {
      throw new Error('empresaId es requerido');
    }

    const now = new Date();

    const props: MikrotikRouterProps = {
      id,
      passwordEnc: passwordEnc,
      nombre: nombre.trim(),
      host: host.trim(),
      sshPort,
      usuario: usuario.trim(),
      descripcion: descripcion?.trim(),
      activo,
      empresaId,
      oltId: oltId ?? null,
      creadoEn: creadoEn ?? now,
      actualizadoEn: actualizadoEn ?? now,
    };

    return new MikrotikRouter(props);
  }

  // Getters de solo lectura
  get id() {
    return this.props.id;
  }

  get nombre() {
    return this.props.nombre;
  }

  get host() {
    return this.props.host;
  }

  get sshPort() {
    return this.props.sshPort;
  }

  get usuario() {
    return this.props.usuario;
  }

  get descripcion() {
    return this.props.descripcion;
  }

  get activo() {
    return this.props.activo;
  }

  get empresaId() {
    return this.props.empresaId;
  }

  get oltId() {
    return this.props.oltId;
  }

  get creadoEn() {
    return this.props.creadoEn;
  }

  get actualizadoEn() {
    return this.props.actualizadoEn;
  }

  get passwordEnc() {
    return this.props.passwordEnc;
  }

  // Para enviar a Prisma / API
  toObject(): MikrotikRouterProps {
    return { ...this.props };
  }

  toJSON() {
    return this.toObject();
  }
}
