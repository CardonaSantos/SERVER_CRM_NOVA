import { AccionInstalacionAcceso } from '../enums/ppoe-instalacion-acceso.enum';
import {
  ClienteInstalacionAccesoProps,
  CrearClienteInstalacionAccesoProps,
} from '../props/cliente-instalacion-acces-props.props';

export class ClienteInstalacionAccesoEntity {
  private constructor(private readonly props: ClienteInstalacionAccesoProps) {}

  static create(
    input: CrearClienteInstalacionAccesoProps,
  ): ClienteInstalacionAccesoEntity {
    this.assertPositiveId(input.instalacionId, 'instalacionId');

    this.assertPositiveId(input.accesoInternetId, 'accesoInternetId');

    this.assertValidAction(input.accion);

    return new ClienteInstalacionAccesoEntity({
      id: null,

      instalacionId: input.instalacionId,
      accesoInternetId: input.accesoInternetId,

      accion: input.accion,

      creadoEn: new Date(),
    });
  }

  static hydrate(
    props: ClienteInstalacionAccesoProps,
  ): ClienteInstalacionAccesoEntity {
    this.assertPositiveId(props.id, 'id');

    this.assertPositiveId(props.instalacionId, 'instalacionId');

    this.assertPositiveId(props.accesoInternetId, 'accesoInternetId');

    this.assertValidAction(props.accion);
    this.assertValidDate(props.creadoEn, 'creadoEn');

    return new ClienteInstalacionAccesoEntity({
      ...props,
      creadoEn: new Date(props.creadoEn),
    });
  }

  get id(): number | null {
    return this.props.id;
  }

  get instalacionId(): number {
    return this.props.instalacionId;
  }

  get accesoInternetId(): number {
    return this.props.accesoInternetId;
  }

  get accion(): AccionInstalacionAcceso {
    return this.props.accion;
  }

  get creadoEn(): Date {
    return new Date(this.props.creadoEn);
  }

  toPrimitives(): ClienteInstalacionAccesoProps {
    return {
      id: this.props.id,

      instalacionId: this.props.instalacionId,
      accesoInternetId: this.props.accesoInternetId,

      accion: this.props.accion,

      creadoEn: new Date(this.props.creadoEn),
    };
  }

  private static assertPositiveId(value: number | null, field: string): void {
    if (value === null || !Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un identificador entero positivo`);
    }
  }

  private static assertValidAction(value: AccionInstalacionAcceso): void {
    const acciones = Object.values(AccionInstalacionAcceso);

    if (!acciones.includes(value)) {
      throw new Error(
        'La acción de la instalación sobre el acceso no es válida',
      );
    }
  }

  private static assertValidDate(value: Date, field: string): void {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`${field} debe ser una fecha válida`);
    }
  }
}
