import { EstadoAutorizacionDesinstalacion } from '../enums/estado-autorizacion-desintalacion.enum';
import { EstadoDesinstalacionCliente } from '../enums/estado-desinstalacion-cliente.enum';

export type ClienteDesinstalacionAutorizacionProps = {
  id?: number;

  desinstalacionId: number;

  solicitadoPorId?: number | null;
  autorizadoPorId?: number | null;

  estado: EstadoAutorizacionDesinstalacion;

  motivoSolicitud?: string | null;
  comentarioAutorizador?: string | null;

  fechaSolicitud?: Date;
  fechaRespuesta?: Date | null;
};

export type CrearClienteDesinstalacionAutorizacionProps = {
  desinstalacionId: number;
  solicitadoPorId?: number | null;
  motivoSolicitud?: string | null;
};

export class ClienteDesinstalacionAutorizacionEntity {
  private constructor(
    private readonly props: ClienteDesinstalacionAutorizacionProps,
  ) {}

  static create(
    props: CrearClienteDesinstalacionAutorizacionProps,
  ): ClienteDesinstalacionAutorizacionEntity {
    const entity = new ClienteDesinstalacionAutorizacionEntity({
      desinstalacionId: props.desinstalacionId,
      solicitadoPorId: props.solicitadoPorId ?? null,
      autorizadoPorId: null,
      estado: EstadoAutorizacionDesinstalacion.PENDIENTE,
      motivoSolicitud: props.motivoSolicitud?.trim() || null,
      comentarioAutorizador: null,
      fechaSolicitud: new Date(),
      fechaRespuesta: null,
    });

    entity.ensureValidBaseProps();

    return entity;
  }

  static hydrate(
    props: ClienteDesinstalacionAutorizacionProps,
  ): ClienteDesinstalacionAutorizacionEntity {
    const entity = new ClienteDesinstalacionAutorizacionEntity(props);
    entity.ensureValidBaseProps();
    return entity;
  }

  rechazar(params: {
    autorizadoPorId: number;
    comentarioAutorizador?: string | null;
    fechaRespuesta?: Date;
  }): void {
    this.ensurePendiente();

    this.ensurePositiveId(params.autorizadoPorId, 'autorizadoPorId');

    this.props.estado = EstadoAutorizacionDesinstalacion.RECHAZADA;
    this.props.autorizadoPorId = params.autorizadoPorId;
    this.props.comentarioAutorizador =
      params.comentarioAutorizador?.trim() || null;
    this.props.fechaRespuesta = params.fechaRespuesta ?? new Date();

    this.ensureValidBaseProps();
  }

  aprobar(params: {
    autorizadoPorId: number;
    comentarioAutorizador?: string | null;
    fechaRespuesta?: Date;
  }): void {
    this.ensurePendiente();

    this.ensurePositiveId(params.autorizadoPorId, 'autorizadoPorId');

    this.props.estado = EstadoAutorizacionDesinstalacion.APROBADA;
    this.props.autorizadoPorId = params.autorizadoPorId;
    this.props.comentarioAutorizador =
      params.comentarioAutorizador?.trim() || null;
    this.props.fechaRespuesta = params.fechaRespuesta ?? new Date();

    this.ensureValidBaseProps();
  }

  private ensurePersisted(action: string): void {
    if (!this.isPersisted) {
      throw new Error(
        `No se puede ${action} una instalación que aún no ha sido guardada.`,
      );
    }
  }

  get isPersisted(): boolean {
    return typeof this.props.id === 'number';
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get desinstalacionId(): number {
    return this.props.desinstalacionId;
  }

  get estado(): EstadoAutorizacionDesinstalacion {
    return this.props.estado;
  }

  get isPendiente(): boolean {
    return this.props.estado === EstadoAutorizacionDesinstalacion.PENDIENTE;
  }

  toPrimitives(): ClienteDesinstalacionAutorizacionProps {
    return { ...this.props };
  }

  private ensurePendiente(): void {
    if (!this.isPendiente) {
      throw new Error('La autorización ya fue respondida.');
    }
  }

  private ensureValidBaseProps(): void {
    this.ensurePositiveId(this.props.desinstalacionId, 'desinstalacionId');

    if (this.props.id !== undefined) {
      this.ensurePositiveId(this.props.id, 'id');
    }

    if (this.props.solicitadoPorId != null) {
      this.ensurePositiveId(this.props.solicitadoPorId, 'solicitadoPorId');
    }

    if (this.props.autorizadoPorId != null) {
      this.ensurePositiveId(this.props.autorizadoPorId, 'autorizadoPorId');
    }
  }

  private ensurePositiveId(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }
}
