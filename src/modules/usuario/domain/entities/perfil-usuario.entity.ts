import { TipoImagenPerfil } from '../enums/tipo-imagen-perfil.enum';
import { UsuarioInvalidoError } from '../errors/usuario.errors';
import { normalizarBio } from '../policies/datos-usuario.policy';
import {
  ImagenPerfil,
  PerfilUsuarioProps,
  PreferenciasPerfil,
} from '../props/perfil-usuario.props';

const CAMPO: Record<TipoImagenPerfil, 'avatar' | 'portada'> = {
  [TipoImagenPerfil.AVATAR]: 'avatar',
  [TipoImagenPerfil.PORTADA]: 'portada',
};

/** Lo que cada usuario configura de su cuenta. Se crea al primer cambio. */
export class PerfilUsuarioEntity {
  private constructor(private props: PerfilUsuarioProps) {}

  /** Todos los avisos encendidos, como la base por defecto. */
  static create(usuarioId: number, ahora: Date): PerfilUsuarioEntity {
    return new PerfilUsuarioEntity({
      id: null,
      usuarioId,
      bio: null,
      avatar: null,
      portada: null,
      notificarWhatsApp: true,
      notificarPush: true,
      notificarSonido: true,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  static hydrate(props: PerfilUsuarioProps): PerfilUsuarioEntity {
    if (props.id === null) {
      throw new UsuarioInvalidoError('El perfil no tiene identificador.');
    }

    return new PerfilUsuarioEntity({ ...props });
  }

  actualizar(cambios: PreferenciasPerfil, fecha: Date): void {
    this.props = {
      ...this.props,
      bio:
        cambios.bio === undefined ? this.props.bio : normalizarBio(cambios.bio),
      notificarWhatsApp:
        cambios.notificarWhatsApp ?? this.props.notificarWhatsApp,
      notificarPush: cambios.notificarPush ?? this.props.notificarPush,
      notificarSonido: cambios.notificarSonido ?? this.props.notificarSonido,
      actualizadoEn: fecha,
    };
  }

  /** @returns La imagen que reemplaza, para borrarla del almacenamiento. */
  ponerImagen(
    tipo: TipoImagenPerfil,
    imagen: ImagenPerfil,
    fecha: Date,
  ): ImagenPerfil | null {
    const anterior = this.props[CAMPO[tipo]];
    this.props = {
      ...this.props,
      [CAMPO[tipo]]: { ...imagen },
      actualizadoEn: fecha,
    };

    return anterior;
  }

  /** @returns La imagen quitada, o `null` si no tenía. */
  quitarImagen(tipo: TipoImagenPerfil, fecha: Date): ImagenPerfil | null {
    const anterior = this.props[CAMPO[tipo]];
    if (!anterior) return null;

    this.props = { ...this.props, [CAMPO[tipo]]: null, actualizadoEn: fecha };
    return anterior;
  }

  get id(): number | null {
    return this.props.id;
  }

  get usuarioId(): number {
    return this.props.usuarioId;
  }

  toPrimitives(): PerfilUsuarioProps {
    return {
      ...this.props,
      avatar: this.props.avatar ? { ...this.props.avatar } : null,
      portada: this.props.portada ? { ...this.props.portada } : null,
      creadoEn: new Date(this.props.creadoEn),
      actualizadoEn: new Date(this.props.actualizadoEn),
    };
  }
}
