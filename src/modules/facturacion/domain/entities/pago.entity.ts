import { MetodoPago } from '../enums/metodo-pago.enum';
import { OrigenPago } from '../enums/origen-pago.enum';
import {
  PagoBoletaRequeridaError,
  PagoInvalidoError,
} from '../errors/facturacion.errors';
import { esMonto } from '../policies/dinero.policy';
import { PagoProps, RegistrarPagoProps } from '../props/pago.props';

export class PagoEntity {
  private constructor(private readonly props: PagoProps) {}

  static registrar(input: RegistrarPagoProps, ahora: Date): PagoEntity {
    if (!esMonto(input.montoPagado) || input.montoPagado <= 0) {
      throw new PagoInvalidoError('El monto pagado debe ser mayor que cero.');
    }
    // Lo cobrado de una ruta se guarda en quetzales enteros.
    if (
      input.origen === OrigenPago.RUTA &&
      !Number.isInteger(input.montoPagado)
    ) {
      throw new PagoInvalidoError(
        'En ruta el monto debe ser en quetzales enteros.',
      );
    }

    // Solo el depósito o transferencia guarda número.
    const porDeposito = input.metodoPago === MetodoPago.DEPOSITO;
    const numeroBoleta = porDeposito ? input.numeroBoleta?.trim() : null;
    if (porDeposito && !numeroBoleta) throw new PagoBoletaRequeridaError();

    return new PagoEntity({
      ...input,
      numeroBoleta: numeroBoleta ?? null,
      rutaId: input.rutaId ?? null,
      id: null,
      codigoConfirmacion: null,
      fechaPago: new Date(input.fechaPago),
      creadoEn: new Date(ahora),
    });
  }

  static hydrate(props: PagoProps): PagoEntity {
    if (props.id !== null && (!Number.isInteger(props.id) || props.id <= 0)) {
      throw new PagoInvalidoError('El pago no es válido.');
    }

    return new PagoEntity({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get facturaId(): number {
    return this.props.facturaId;
  }

  get clienteId(): number {
    return this.props.clienteId;
  }

  get montoPagado(): number {
    return this.props.montoPagado;
  }

  get fechaPago(): Date {
    return new Date(this.props.fechaPago);
  }

  get numeroBoleta(): string | null {
    return this.props.numeroBoleta;
  }

  get rutaId(): number | null {
    return this.props.rutaId;
  }

  toPrimitives(): PagoProps {
    return {
      ...this.props,
      fechaPago: new Date(this.props.fechaPago),
      creadoEn: new Date(this.props.creadoEn),
    };
  }
}
