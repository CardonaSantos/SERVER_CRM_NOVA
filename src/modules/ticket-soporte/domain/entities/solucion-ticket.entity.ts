import {
  CatalogoTicketInvalidoError,
  SolucionTicketNoEncontradaError,
} from '../errors/ticket-soporte.errors';
import { SolucionTicketProps } from '../props/catalogo-ticket.props';

const LARGO_MAXIMO_NOMBRE = 120;
const LARGO_MAXIMO_DESCRIPCION = 500;

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

function limpiarDescripcion(texto: string | null | undefined): string | null {
  const limpio = texto?.trim() || null;

  if (limpio && limpio.length > LARGO_MAXIMO_DESCRIPCION) {
    throw new CatalogoTicketInvalidoError('La descripción es demasiado larga.');
  }

  return limpio;
}

export class SolucionTicketEntity {
  private constructor(private props: SolucionTicketProps) {}

  static create(input: {
    nombre: string;
    descripcion?: string | null;
  }): SolucionTicketEntity {
    return new SolucionTicketEntity({
      id: null,
      nombre: exigirNombre(input.nombre),
      descripcion: limpiarDescripcion(input.descripcion),
      eliminada: false,
    });
  }

  static hydrate(props: SolucionTicketProps): SolucionTicketEntity {
    return new SolucionTicketEntity({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get eliminada(): boolean {
    return this.props.eliminada;
  }

  editar(cambios: { nombre?: string; descripcion?: string | null }): void {
    if (this.eliminada) throw new SolucionTicketNoEncontradaError();

    if (cambios.nombre !== undefined) {
      this.props.nombre = exigirNombre(cambios.nombre);
    }
    if (cambios.descripcion !== undefined) {
      this.props.descripcion = limpiarDescripcion(cambios.descripcion);
    }
  }

  /** Deja de ofrecerse; los tickets resueltos con ella la conservan. */
  eliminar(): void {
    if (this.eliminada) throw new SolucionTicketNoEncontradaError();
    this.props.eliminada = true;
  }

  restaurar(input: { nombre: string; descripcion?: string | null }): void {
    this.props.nombre = exigirNombre(input.nombre);
    this.props.descripcion = limpiarDescripcion(input.descripcion);
    this.props.eliminada = false;
  }

  toPrimitives(): SolucionTicketProps {
    return { ...this.props };
  }
}
