import { EstadoMora } from '@prisma/client';
import Decimal from 'decimal.js';

export class MoraCuota {
  constructor(
    private readonly id: number,
    private readonly diasMora: number,
    private readonly interes: Decimal,
    private readonly calculadoEn: Date,
    private readonly estado: EstadoMora,
  ) {}

  static rehidratar(props: {
    id: number;
    diasMora: number;
    interes: Decimal;
    calculadoEn: Date;
    estado: EstadoMora;
  }): MoraCuota {
    return new MoraCuota(
      props.id,
      props.diasMora,
      props.interes,
      props.calculadoEn,
      props.estado,
    );
  }

  getId() {
    return this.id;
  }
  getDiasMora() {
    return this.diasMora;
  }
  getInteres() {
    return this.interes;
  }
  getCalculadoEn() {
    return this.calculadoEn;
  }

  getEstado() {
    return this.estado;
  }
}
