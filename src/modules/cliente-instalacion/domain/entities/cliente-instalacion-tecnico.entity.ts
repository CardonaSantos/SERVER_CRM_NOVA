import { RolTecnicoOperacionCliente } from '../enums/rol-tecnico-operacion-cliente.enum';
import {
  ClienteInstalacionTecnicoProps,
  CrearClienteInstalacionTecnicoProps,
} from './entities-props.props';

export class ClienteInstalacionTecnicoEntity {
  private constructor(private readonly props: ClienteInstalacionTecnicoProps) {}

  static create(
    props: CrearClienteInstalacionTecnicoProps,
  ): ClienteInstalacionTecnicoEntity {
    const esResponsable =
      props.esResponsable === true ||
      props.rol === RolTecnicoOperacionCliente.RESPONSABLE;

    const entity = new ClienteInstalacionTecnicoEntity({
      instalacionId: props.instalacionId,
      tecnicoId: props.tecnicoId,

      rol: esResponsable
        ? RolTecnicoOperacionCliente.RESPONSABLE
        : (props.rol ?? RolTecnicoOperacionCliente.APOYO),

      esResponsable,

      tiempoMinutos: null,
      observaciones: props.observaciones?.trim() || null,

      tecnicoNombreSnapshot: props.tecnicoNombreSnapshot?.trim() || null,

      creadoEn: undefined,
      actualizadoEn: undefined,
    });

    entity.ensureValidProps();

    return entity;
  }

  static hydrate(
    props: ClienteInstalacionTecnicoProps,
  ): ClienteInstalacionTecnicoEntity {
    const entity = new ClienteInstalacionTecnicoEntity({
      ...props,
      observaciones: props.observaciones?.trim() || null,
      tecnicoNombreSnapshot: props.tecnicoNombreSnapshot?.trim() || null,
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

  get tecnicoId(): number | null | undefined {
    return this.props.tecnicoId;
  }

  get rol(): RolTecnicoOperacionCliente {
    return this.props.rol;
  }

  get esResponsable(): boolean {
    return this.props.esResponsable;
  }

  get tiempoMinutos(): number | null | undefined {
    return this.props.tiempoMinutos;
  }

  get observaciones(): string | null | undefined {
    return this.props.observaciones;
  }

  get tecnicoNombreSnapshot(): string | null | undefined {
    return this.props.tecnicoNombreSnapshot;
  }

  cambiarRol(rol: RolTecnicoOperacionCliente): void {
    this.props.rol = rol;

    this.props.esResponsable = rol === RolTecnicoOperacionCliente.RESPONSABLE;

    this.ensureValidProps();
  }

  marcarComoResponsable(): void {
    this.props.esResponsable = true;
    this.props.rol = RolTecnicoOperacionCliente.RESPONSABLE;

    this.ensureValidProps();
  }

  quitarComoResponsable(): void {
    this.props.esResponsable = false;

    if (this.props.rol === RolTecnicoOperacionCliente.RESPONSABLE) {
      this.props.rol = RolTecnicoOperacionCliente.APOYO;
    }

    this.ensureValidProps();
  }

  registrarTiempo(tiempoMinutos: number | null): void {
    if (
      tiempoMinutos !== null &&
      (!Number.isInteger(tiempoMinutos) || tiempoMinutos < 0)
    ) {
      throw new Error('tiempoMinutos debe ser un entero mayor o igual a 0.');
    }

    this.props.tiempoMinutos = tiempoMinutos;
  }

  cambiarObservaciones(observaciones?: string | null): void {
    this.props.observaciones = observaciones?.trim() || null;
  }

  toPrimitives(): ClienteInstalacionTecnicoProps {
    return {
      ...this.props,
    };
  }

  private ensureValidProps(): void {
    this.ensurePositiveId(this.props.instalacionId, 'instalacionId');

    if (this.props.id !== undefined) {
      this.ensurePositiveId(this.props.id, 'id');
    }

    if (this.props.tecnicoId != null) {
      this.ensurePositiveId(this.props.tecnicoId, 'tecnicoId');
    }

    if (
      this.props.esResponsable &&
      this.props.rol !== RolTecnicoOperacionCliente.RESPONSABLE
    ) {
      throw new Error('Un técnico responsable debe tener el rol RESPONSABLE.');
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
