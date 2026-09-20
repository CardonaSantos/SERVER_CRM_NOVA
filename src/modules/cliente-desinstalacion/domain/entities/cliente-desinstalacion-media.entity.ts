import { TipoEvidenciaClienteOperacion } from 'src/modules/cliente-instalacion/domain/enums/tipo-evidencia-cliente-operacion.enum';

export type ClienteDesinstalacionMediaProps = {
  id: number | null;

  desinstalacionId: number;

  mediaId: number;

  tipo: TipoEvidenciaClienteOperacion;

  descripcion: string | null;

  orden: number;

  creadoEn: Date;
};

export type CrearClienteDesinstalacionMediaProps = {
  desinstalacionId: number;

  mediaId: number;

  tipo: TipoEvidenciaClienteOperacion;

  descripcion?: string | null;

  orden?: number | null;
};

export class ClienteDesinstalacionMediaEntity {
  private constructor(
    private readonly props: ClienteDesinstalacionMediaProps,
  ) {}

  static create(
    input: CrearClienteDesinstalacionMediaProps,
  ): ClienteDesinstalacionMediaEntity {
    this.assertPositiveInteger(input.desinstalacionId, 'desinstalacionId');

    this.assertPositiveInteger(input.mediaId, 'mediaId');

    const orden = input.orden ?? 0;

    if (!Number.isInteger(orden) || orden < 0) {
      throw new Error('orden debe ser un entero mayor o igual a cero.');
    }

    return new ClienteDesinstalacionMediaEntity({
      id: null,

      desinstalacionId: input.desinstalacionId,

      mediaId: input.mediaId,

      tipo: input.tipo,

      descripcion: input.descripcion?.trim() || null,

      orden,

      creadoEn: new Date(),
    });
  }

  static fromPrimitives(
    props: ClienteDesinstalacionMediaProps,
  ): ClienteDesinstalacionMediaEntity {
    return new ClienteDesinstalacionMediaEntity(props);
  }

  get id(): number | null {
    return this.props.id;
  }

  get desinstalacionId(): number {
    return this.props.desinstalacionId;
  }

  get mediaId(): number {
    return this.props.mediaId;
  }

  get tipo(): TipoEvidenciaClienteOperacion {
    return this.props.tipo;
  }

  get descripcion(): string | null {
    return this.props.descripcion;
  }

  get orden(): number {
    return this.props.orden;
  }

  get creadoEn(): Date {
    return this.props.creadoEn;
  }

  toPrimitives(): ClienteDesinstalacionMediaProps {
    return {
      ...this.props,
    };
  }

  private static assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }
}
