import { RolTecnicoOperacionCliente } from 'src/modules/cliente-instalacion/domain/enums/rol-tecnico-operacion-cliente.enum';

export type ClienteDesinstalacionTecnicoProps = {
  id?: number;

  desinstalacionId: number;
  tecnicoId?: number | null;

  rol: RolTecnicoOperacionCliente;
  esResponsable: boolean;

  tiempoMinutos?: number | null;
  observaciones?: string | null;
  tecnicoNombreSnapshot?: string | null;

  creadoEn?: Date;
  actualizadoEn?: Date;
};

export type CrearClienteDesinstalacionTecnicoProps = {
  desinstalacionId: number;
  tecnicoId?: number | null;

  rol?: RolTecnicoOperacionCliente;
  esResponsable?: boolean;

  tiempoMinutos?: number | null;
  observaciones?: string | null;
  tecnicoNombreSnapshot?: string | null;
};

export class ClienteDesinstalacionTecnicoEntity {
  private constructor(
    private readonly props: ClienteDesinstalacionTecnicoProps,
  ) {}

  static create(
    props: CrearClienteDesinstalacionTecnicoProps,
  ): ClienteDesinstalacionTecnicoEntity {
    const entity = new ClienteDesinstalacionTecnicoEntity({
      desinstalacionId: props.desinstalacionId,
      tecnicoId: props.tecnicoId ?? null,

      rol: props.rol ?? RolTecnicoOperacionCliente.APOYO,
      esResponsable: props.esResponsable ?? false,

      tiempoMinutos: props.tiempoMinutos ?? null,
      observaciones: props.observaciones?.trim() || null,
      tecnicoNombreSnapshot: props.tecnicoNombreSnapshot?.trim() || null,

      creadoEn: undefined,
      actualizadoEn: undefined,
    });

    entity.ensureValid();

    return entity;
  }

  static hydrate(
    props: ClienteDesinstalacionTecnicoProps,
  ): ClienteDesinstalacionTecnicoEntity {
    const entity = new ClienteDesinstalacionTecnicoEntity(props);
    entity.ensureValid();
    return entity;
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get desinstalacionId(): number {
    return this.props.desinstalacionId;
  }

  get tecnicoId(): number | null | undefined {
    return this.props.tecnicoId;
  }

  get esResponsable(): boolean {
    return this.props.esResponsable;
  }

  toPrimitives(): ClienteDesinstalacionTecnicoProps {
    return { ...this.props };
  }

  private ensureValid(): void {
    this.ensurePositiveId(this.props.desinstalacionId, 'desinstalacionId');

    if (this.props.id !== undefined) {
      this.ensurePositiveId(this.props.id, 'id');
    }

    if (this.props.tecnicoId != null) {
      this.ensurePositiveId(this.props.tecnicoId, 'tecnicoId');
    }

    if (
      this.props.tecnicoId == null &&
      !this.props.tecnicoNombreSnapshot?.trim()
    ) {
      throw new Error(
        'Debe indicar tecnicoId o tecnicoNombreSnapshot para asignar un técnico.',
      );
    }

    if (
      this.props.tiempoMinutos != null &&
      (!Number.isInteger(this.props.tiempoMinutos) ||
        this.props.tiempoMinutos < 0)
    ) {
      throw new Error('tiempoMinutos debe ser un entero mayor o igual a 0.');
    }
  }

  private ensurePositiveId(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }
}
