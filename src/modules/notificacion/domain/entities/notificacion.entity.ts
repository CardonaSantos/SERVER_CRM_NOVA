import { NotificacionInvalidaError } from '../errors/notificacion.errors';
import {
  CrearNotificacionProps,
  NotificacionProps,
} from '../props/notificacion.props';
import { SeveridadNotificacion } from '../enums/severidad-notificacion.enum';

const MAX_TITULO = 200;
const MAX_MENSAJE = 5000;
const MAX_CORTO = 255;

const texto = (valor: string | null | undefined): string | null => {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
};

/** Aviso interno para los usuarios del CRM. Una vez creada no cambia. */
export class NotificacionEntity {
  private constructor(private readonly props: NotificacionProps) {}

  static create(
    input: CrearNotificacionProps,
    ahora: Date,
  ): NotificacionEntity {
    const props: NotificacionProps = {
      id: null,
      titulo: texto(input.titulo),
      mensaje: input.mensaje?.trim() ?? '',
      categoria: input.categoria,
      severidad: input.severidad ?? SeveridadNotificacion.INFO,
      subtipo: texto(input.subtipo),
      referencia: input.referencia ?? null,
      ruta: texto(input.ruta),
      etiquetaAccion: texto(input.etiquetaAccion),
      audiencia: input.audiencia,
      remitenteId: input.remitenteId ?? null,
      creadaEn: new Date(ahora),
    };

    NotificacionEntity.assertConsistencia(props);
    return new NotificacionEntity(props);
  }

  static hydrate(props: NotificacionProps): NotificacionEntity {
    return new NotificacionEntity({ ...props });
  }

  private static assertConsistencia(p: NotificacionProps): void {
    if (!p.mensaje) {
      throw new NotificacionInvalidaError(
        'La notificación necesita un mensaje.',
      );
    }

    if (p.mensaje.length > MAX_MENSAJE) {
      throw new NotificacionInvalidaError('El mensaje es demasiado largo.');
    }

    if (p.titulo && p.titulo.length > MAX_TITULO) {
      throw new NotificacionInvalidaError('El título es demasiado largo.');
    }

    for (const valor of [p.subtipo, p.ruta, p.etiquetaAccion]) {
      if (valor && valor.length > MAX_CORTO) {
        throw new NotificacionInvalidaError();
      }
    }

    if (
      p.referencia &&
      (!p.referencia.tipo.trim() ||
        !Number.isInteger(p.referencia.id) ||
        p.referencia.id <= 0)
    ) {
      throw new NotificacionInvalidaError('La referencia no es válida.');
    }
  }

  get id(): number | null {
    return this.props.id;
  }

  toPrimitives(): NotificacionProps {
    return {
      ...this.props,
      referencia: this.props.referencia ? { ...this.props.referencia } : null,
      creadaEn: new Date(this.props.creadaEn),
    };
  }
}
