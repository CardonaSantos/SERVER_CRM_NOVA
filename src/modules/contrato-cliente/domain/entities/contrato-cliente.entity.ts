import { ContratoDatosInvalidosError } from '../errors/contrato-cliente.errors';
import {
  ContratoClienteProps,
  CrearContratoClienteProps,
} from '../props/contrato-cliente.props';

const FECHA_NEGOCIO = /^\d{4}-\d{2}-\d{2}$/;

export class ContratoClienteEntity {
  private constructor(private props: ContratoClienteProps) {}

  static create(
    input: CrearContratoClienteProps,
    ahora: Date,
  ): ContratoClienteEntity {
    if (!Number.isInteger(input.clienteId) || input.clienteId < 1) {
      throw new ContratoDatosInvalidosError('El cliente es obligatorio.');
    }

    const costo = input.costoInstalacion ?? null;
    if (costo !== null && (!Number.isFinite(costo) || costo < 0)) {
      throw new ContratoDatosInvalidosError(
        'El costo de instalación no puede ser negativo.',
      );
    }

    const fechas = [input.fechaInstalacionProgramada, input.fechaPago];
    if (fechas.some((fecha) => fecha && !FECHA_NEGOCIO.test(fecha))) {
      throw new ContratoDatosInvalidosError(
        'Las fechas deben tener el formato AAAA-MM-DD.',
      );
    }

    return new ContratoClienteEntity({
      id: null,
      clienteId: input.clienteId,
      fechaInstalacionProgramada: input.fechaInstalacionProgramada ?? null,
      fechaPago: input.fechaPago ?? null,
      costoInstalacion: costo,
      observaciones: input.observaciones?.trim() || null,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  static hydrate(props: ContratoClienteProps): ContratoClienteEntity {
    return new ContratoClienteEntity({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get clienteId(): number {
    return this.props.clienteId;
  }

  toPrimitives(): ContratoClienteProps {
    return { ...this.props };
  }
}
