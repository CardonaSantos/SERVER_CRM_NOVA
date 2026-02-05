export class Contrato {
  private constructor(
    readonly id: number,
    readonly creditoId: number,
    readonly contenido: string,
    readonly version: string,
    readonly firmadoEn: Date | null,
    readonly creadoEn: Date,
    readonly actualizadoEn: Date,
  ) {}

  static rehidratar(props: {
    id: number;
    creditoId: number;
    contenido: string;
    version: string;
    firmadoEn: Date | null;
    creadoEn: Date;
    actualizadoEn: Date;
  }): Contrato {
    return new Contrato(
      props.id,
      props.creditoId,
      props.contenido,
      props.version,
      props.firmadoEn,
      props.creadoEn,
      props.actualizadoEn,
    );
  }

  static crear(props: {
    creditoId: number;
    contenido: string;
    version: string;
  }): Contrato {
    return new Contrato(
      0,
      props.creditoId,
      props.contenido,
      props.version,
      null,
      new Date(),
      new Date(),
    );
  }

  firmar(fecha = new Date()) {
    if (this.firmadoEn) {
      throw new Error('El contrato ya está firmado');
    }

    return Contrato.rehidratar({
      ...this,
      firmadoEn: fecha,
      actualizadoEn: new Date(),
    });
  }
}
