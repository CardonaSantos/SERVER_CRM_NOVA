import { FotoMensualInvalidaError } from '../errors/dashboard.errors';
import {
  CifrasFotoMensual,
  FotoMensualCarteraProps,
  TomarFotoMensualProps,
} from '../props/foto-mensual-cartera.props';

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

const CONTEOS: (keyof CifrasFotoMensual)[] = [
  'totalClientes',
  'activos',
  'suspendidos',
  'pendientesActivacion',
  'enInstalacion',
  'desinstalados',
  'alDia',
  'pagoPendiente',
  'atrasados',
  'morosos',
  'facturasConDeuda',
  'clientesConDeuda',
  'clientesConDeudaVencida',
];

const MONTOS: (keyof CifrasFotoMensual)[] = [
  'deuda',
  'deudaVencida',
  'deudaDesinstalados',
];

/**
 * Foto de la cartera al cerrar un mes: lo que no se puede recalcular después
 * (estados de los clientes y deuda de ese momento). Una por mes; no cambia.
 */
export class FotoMensualCarteraEntity {
  private constructor(private readonly props: FotoMensualCarteraProps) {}

  static tomar(
    input: TomarFotoMensualProps,
    ahora: Date,
  ): FotoMensualCarteraEntity {
    const props: FotoMensualCarteraProps = {
      ...input,
      id: null,
      tomadaEn: new Date(ahora),
    };
    FotoMensualCarteraEntity.assertConsistencia(props);
    return new FotoMensualCarteraEntity(props);
  }

  static hydrate(props: FotoMensualCarteraProps): FotoMensualCarteraEntity {
    FotoMensualCarteraEntity.assertConsistencia(props);
    return new FotoMensualCarteraEntity({ ...props });
  }

  get mes(): string {
    return this.props.mes;
  }

  toPrimitives(): FotoMensualCarteraProps {
    return { ...this.props, tomadaEn: new Date(this.props.tomadaEn) };
  }

  private static assertConsistencia(props: FotoMensualCarteraProps): void {
    if (!MES.test(props.mes)) {
      throw new FotoMensualInvalidaError(
        'El mes de la foto debe tener el formato AAAA-MM.',
      );
    }
    for (const campo of CONTEOS) {
      const valor = props[campo];
      if (!Number.isInteger(valor) || valor < 0) {
        throw new FotoMensualInvalidaError(
          `La cifra ${campo} de la foto debe ser un entero desde 0.`,
        );
      }
    }
    for (const campo of MONTOS) {
      const valor = props[campo];
      if (!Number.isFinite(valor) || valor < 0) {
        throw new FotoMensualInvalidaError(
          `El monto ${campo} de la foto no puede ser negativo.`,
        );
      }
    }
    if (props.deudaVencida > props.deuda) {
      throw new FotoMensualInvalidaError(
        'La deuda vencida no puede ser mayor que la deuda.',
      );
    }
  }
}
