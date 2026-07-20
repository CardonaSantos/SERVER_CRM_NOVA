import { TipoEvidenciaClienteOperacion } from '../enums/tipo-evidencia-cliente-operacion.enum';
import {
  ClienteInstalacionMediaProps,
  CrearClienteInstalacionMediaProps,
} from './cliente-instalacion-media-props';

export class ClienteInstalacionMediaEntity {
  private constructor(private readonly props: ClienteInstalacionMediaProps) {}

  static create(
    props: CrearClienteInstalacionMediaProps,
  ): ClienteInstalacionMediaEntity {
    const entity = new ClienteInstalacionMediaEntity({
      instalacionId: props.instalacionId,
      mediaId: props.mediaId,
      tipo: props.tipo ?? TipoEvidenciaClienteOperacion.OTRO,
      descripcion: props.descripcion?.trim() || null,
      orden: props.orden ?? 0,
      creadoEn: undefined,
    });

    entity.ensureValidProps();

    return entity;
  }

  static hydrate(
    props: ClienteInstalacionMediaProps,
  ): ClienteInstalacionMediaEntity {
    const entity = new ClienteInstalacionMediaEntity({
      ...props,
      descripcion: props.descripcion?.trim() || null,
      orden: props.orden ?? 0,
    });

    entity.ensureValidProps();

    return entity;
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get instalacionId(): number {
    return this.props.instalacionId;
  }

  get mediaId(): number {
    return this.props.mediaId;
  }

  get tipo(): TipoEvidenciaClienteOperacion {
    return this.props.tipo;
  }

  get descripcion(): string | null | undefined {
    return this.props.descripcion;
  }

  get orden(): number {
    return this.props.orden;
  }

  get creadoEn(): Date | undefined {
    return this.props.creadoEn;
  }

  get isPersisted(): boolean {
    return typeof this.props.id === 'number';
  }

  cambiarDescripcion(descripcion?: string | null): void {
    this.props.descripcion = descripcion?.trim() || null;
    this.ensureValidProps();
  }

  cambiarOrden(orden: number): void {
    if (!Number.isInteger(orden) || orden < 0) {
      throw new Error('orden debe ser un entero mayor o igual a 0.');
    }

    this.props.orden = orden;
  }

  cambiarTipo(tipo: TipoEvidenciaClienteOperacion): void {
    this.props.tipo = tipo;
    this.ensureValidProps();
  }

  toPrimitives(): ClienteInstalacionMediaProps {
    return { ...this.props };
  }

  private ensureValidProps(): void {
    this.ensurePositiveId(this.props.instalacionId, 'instalacionId');
    this.ensurePositiveId(this.props.mediaId, 'mediaId');

    if (this.props.id !== undefined) {
      this.ensurePositiveId(this.props.id, 'id');
    }

    if (!Number.isInteger(this.props.orden) || this.props.orden < 0) {
      throw new Error('orden debe ser un entero mayor o igual a 0.');
    }

    if (!this.props.tipo) {
      throw new Error('tipo de evidencia es obligatorio.');
    }
  }

  private ensurePositiveId(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }
}
