import {
  CatalogoTicketInvalidoError,
  EtiquetaTicketNoEncontradaError,
} from '../errors/ticket-soporte.errors';
import { EtiquetaTicketProps } from '../props/catalogo-ticket.props';

const LARGO_MAXIMO_NOMBRE = 60;

function exigirNombre(nombre: string): string {
  const limpio = nombre.trim();

  if (!limpio) {
    throw new CatalogoTicketInvalidoError('El nombre es obligatorio.');
  }
  if (limpio.length > LARGO_MAXIMO_NOMBRE) {
    throw new CatalogoTicketInvalidoError('El nombre es demasiado largo.');
  }

  return limpio;
}

export class EtiquetaTicketEntity {
  private constructor(private props: EtiquetaTicketProps) {}

  static create(nombre: string): EtiquetaTicketEntity {
    return new EtiquetaTicketEntity({
      id: null,
      nombre: exigirNombre(nombre),
      eliminadoEn: null,
      eliminadoPorId: null,
    });
  }

  static hydrate(props: EtiquetaTicketProps): EtiquetaTicketEntity {
    return new EtiquetaTicketEntity({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get eliminada(): boolean {
    return this.props.eliminadoEn !== null;
  }

  renombrar(nombre: string): void {
    if (this.eliminada) throw new EtiquetaTicketNoEncontradaError();
    this.props.nombre = exigirNombre(nombre);
  }

  /** Deja de ofrecerse; los tickets que la tienen la conservan. */
  eliminar(usuarioId: number, ahora: Date): void {
    if (this.eliminada) throw new EtiquetaTicketNoEncontradaError();
    this.props.eliminadoEn = new Date(ahora);
    this.props.eliminadoPorId = usuarioId;
  }

  /** Crear de nuevo un nombre eliminado recupera la etiqueta. */
  restaurar(nombre: string): void {
    this.props.nombre = exigirNombre(nombre);
    this.props.eliminadoEn = null;
    this.props.eliminadoPorId = null;
  }

  toPrimitives(): EtiquetaTicketProps {
    return { ...this.props };
  }
}
