export interface PerfilProps {
  id?: number;
  usuarioId: number;

  avatar?: PerfilMedia;
  portada?: PerfilMedia;

  bio?: string;
  telefono?: string;

  notificarWhatsApp: boolean;
  notificarPush: boolean;
  notificarSonido: boolean;

  creadoEn?: Date;
  actualizadoEn?: Date;
}

export class Perfil {
  private constructor(private props: PerfilProps) {}

  static crear(
    props: Omit<
      PerfilProps,
      'notificarWhatsApp' | 'notificarPush' | 'notificarSonido'
    > & {
      notificarWhatsApp?: boolean;
      notificarPush?: boolean;
      notificarSonido?: boolean;
    },
  ) {
    return new Perfil({
      ...props,
      notificarWhatsApp: props.notificarWhatsApp ?? true,
      notificarPush: props.notificarPush ?? true,
      notificarSonido: props.notificarSonido ?? true,
      creadoEn: props.creadoEn ?? new Date(),
      actualizadoEn: props.actualizadoEn ?? new Date(),
    });
  }

  actualizarDatos(data: {
    bio?: string;
    telefono?: string;
    notificarWhatsApp?: boolean;
    notificarPush?: boolean;
    notificarSonido?: boolean;
  }) {
    if (data.bio !== undefined) this.props.bio = data.bio;
    if (data.telefono !== undefined) this.props.telefono = data.telefono;
    if (data.notificarWhatsApp !== undefined)
      this.props.notificarWhatsApp = data.notificarWhatsApp;
    if (data.notificarPush !== undefined)
      this.props.notificarPush = data.notificarPush;
    if (data.notificarSonido !== undefined)
      this.props.notificarSonido = data.notificarSonido;

    this.touch();
  }

  actualizarAvatar(media: PerfilMedia) {
    this.props.avatar = media;
    this.touch();
  }

  actualizarPortada(media: PerfilMedia) {
    this.props.portada = media;
    this.touch();
  }

  eliminarAvatar() {
    this.props.avatar = undefined;
    this.touch();
  }

  eliminarPortada() {
    this.props.portada = undefined;
    this.touch();
  }

  private touch() {
    this.props.actualizadoEn = new Date();
  }

  toJSON() {
    return {
      id: this.props.id,
      usuarioId: this.props.usuarioId,
      avatar: this.props.avatar?.toJSON(),
      portada: this.props.portada?.toJSON(),
      bio: this.props.bio,
      telefono: this.props.telefono,
      notificarWhatsApp: this.props.notificarWhatsApp,
      notificarPush: this.props.notificarPush,
      notificarSonido: this.props.notificarSonido,
      creadoEn: this.props.creadoEn,
      actualizadoEn: this.props.actualizadoEn,
    };
  }

  // Getters

  getId() {
    return this.props.id;
  }

  getUsuarioId() {
    return this.props.usuarioId;
  }

  getAvatar() {
    return this.props.avatar;
  }

  getPortada() {
    return this.props.portada;
  }

  getBio() {
    return this.props.bio;
  }

  getTelefono() {
    return this.props.telefono;
  }

  getNotificarWhatsApp() {
    return this.props.notificarWhatsApp;
  }

  getNotificarPush() {
    return this.props.notificarPush;
  }

  getNotificarSonido() {
    return this.props.notificarSonido;
  }

  getCreadoEn() {
    return this.props.creadoEn;
  }

  getActualizadoEn() {
    return this.props.actualizadoEn;
  }
}

export interface PerfilMediaProps {
  url: string;
  key: string;
  bucket: string;
  mimeType: string;
  size: number;
}

export class PerfilMedia {
  private constructor(private readonly props: PerfilMediaProps) {}

  static crear(props: PerfilMediaProps): PerfilMedia {
    if (!props.url) throw new Error('url requerida');
    if (!props.key) throw new Error('key requerida');
    if (!props.bucket) throw new Error('bucket requerido');

    return new PerfilMedia(props);
  }

  toJSON() {
    return { ...this.props };
  }

  getUrl() {
    return this.props.url;
  }

  getKey() {
    return this.props.key;
  }

  getBucket() {
    return this.props.bucket;
  }

  getMimeType() {
    return this.props.mimeType;
  }

  getSize() {
    return this.props.size;
  }
}
