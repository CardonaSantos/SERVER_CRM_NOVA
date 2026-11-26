import { TicketFirmaOrigen } from '../enums/ticket-firma-origen.enum';
import { TicketFirmaTipo } from '../enums/ticket-firma-tipo.enum';
import { TicketConformidadDatosInvalidosError } from '../errors/ticket-soporte-conformidad.errors';
import {
  CrearTicketFirmaClienteProps,
  CrearTicketFirmaTecnicoProps,
  TicketFirmaProps,
} from '../props/ticket-firma.props';

/** Firma de la conformidad (cliente o técnico). Es evidencia histórica: no se modifica. */
export class TicketFirmaEntity {
  private constructor(private readonly props: TicketFirmaProps) {}

  static createCliente(
    input: CrearTicketFirmaClienteProps,
    ahora: Date,
  ): TicketFirmaEntity {
    assertIdPositivo(input.conformidadId, 'conformidadId');
    assertIdPositivo(input.mediaId, 'mediaId');
    assertFechaValida(ahora, 'firmadoEn');

    return new TicketFirmaEntity({
      id: null,
      conformidadId: input.conformidadId,
      mediaId: input.mediaId,
      tipo: TicketFirmaTipo.CLIENTE,
      usuarioFirmanteId: null,
      nombreFirmante: textoObligatorio(input.nombreFirmante, 'nombreFirmante'),
      telefonoFirmante: textoObligatorio(
        input.telefonoFirmante,
        'telefonoFirmante',
      ),
      origen: input.origen,
      ipOrigen: textoOpcional(input.ipOrigen),
      userAgent: textoOpcional(input.userAgent),
      firmadoEn: new Date(ahora),
    });
  }

  static createTecnico(
    input: CrearTicketFirmaTecnicoProps,
    ahora: Date,
  ): TicketFirmaEntity {
    assertIdPositivo(input.conformidadId, 'conformidadId');
    assertIdPositivo(input.mediaId, 'mediaId');
    assertIdPositivo(input.usuarioFirmanteId, 'usuarioFirmanteId');
    assertFechaValida(ahora, 'firmadoEn');

    return new TicketFirmaEntity({
      id: null,
      conformidadId: input.conformidadId,
      mediaId: input.mediaId,
      tipo: TicketFirmaTipo.TECNICO,
      usuarioFirmanteId: input.usuarioFirmanteId,
      nombreFirmante: textoObligatorio(input.nombreFirmante, 'nombreFirmante'),
      telefonoFirmante: null,
      origen: TicketFirmaOrigen.CRM,
      ipOrigen: textoOpcional(input.ipOrigen),
      userAgent: textoOpcional(input.userAgent),
      firmadoEn: new Date(ahora),
    });
  }

  /** Reconstruye desde persistencia: valida consistencia, no reglas de creación. */
  static hydrate(props: TicketFirmaProps): TicketFirmaEntity {
    assertIdPositivo(props.id, 'id');
    assertIdPositivo(props.conformidadId, 'conformidadId');
    assertIdPositivo(props.mediaId, 'mediaId');
    assertFechaValida(props.firmadoEn, 'firmadoEn');

    const normalizada: TicketFirmaProps = {
      ...props,
      nombreFirmante: textoObligatorio(props.nombreFirmante, 'nombreFirmante'),
      telefonoFirmante: textoOpcional(props.telefonoFirmante),
      ipOrigen: textoOpcional(props.ipOrigen),
      userAgent: textoOpcional(props.userAgent),
      firmadoEn: new Date(props.firmadoEn),
    };

    TicketFirmaEntity.assertConsistencia(normalizada);

    return new TicketFirmaEntity(normalizada);
  }

  esFirmaCliente(): boolean {
    return this.props.tipo === TicketFirmaTipo.CLIENTE;
  }

  esFirmaTecnico(): boolean {
    return this.props.tipo === TicketFirmaTipo.TECNICO;
  }

  get id(): number | null {
    return this.props.id;
  }

  get conformidadId(): number {
    return this.props.conformidadId;
  }

  get mediaId(): number {
    return this.props.mediaId;
  }

  get tipo(): TicketFirmaTipo {
    return this.props.tipo;
  }

  get usuarioFirmanteId(): number | null {
    return this.props.usuarioFirmanteId;
  }

  get nombreFirmante(): string {
    return this.props.nombreFirmante;
  }

  get telefonoFirmante(): string | null {
    return this.props.telefonoFirmante;
  }

  get origen(): TicketFirmaOrigen {
    return this.props.origen;
  }

  get ipOrigen(): string | null {
    return this.props.ipOrigen;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get firmadoEn(): Date {
    return new Date(this.props.firmadoEn);
  }

  toPrimitives(): TicketFirmaProps {
    return { ...this.props, firmadoEn: new Date(this.props.firmadoEn) };
  }

  private static assertConsistencia(props: TicketFirmaProps): void {
    if (props.tipo === TicketFirmaTipo.CLIENTE) {
      if (!props.telefonoFirmante) {
        throw new TicketConformidadDatosInvalidosError(
          'La firma del cliente requiere teléfono del firmante.',
        );
      }

      if (props.usuarioFirmanteId !== null) {
        throw new TicketConformidadDatosInvalidosError(
          'La firma del cliente no puede tener usuario firmante.',
        );
      }

      return;
    }

    assertIdPositivo(props.usuarioFirmanteId, 'usuarioFirmanteId');

    if (props.origen !== TicketFirmaOrigen.CRM) {
      throw new TicketConformidadDatosInvalidosError(
        'La firma del técnico únicamente puede originarse desde el CRM.',
      );
    }
  }
}

function assertIdPositivo(valor: number | null, campo: string): void {
  if (valor === null || !Number.isInteger(valor) || valor <= 0) {
    throw new TicketConformidadDatosInvalidosError(
      `El dato ${campo} no es válido.`,
    );
  }
}

function assertFechaValida(valor: Date, campo: string): void {
  if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) {
    throw new TicketConformidadDatosInvalidosError(
      `La fecha ${campo} no es válida.`,
    );
  }
}

function textoObligatorio(valor: string, campo: string): string {
  const recortado = valor?.trim();

  if (!recortado) {
    throw new TicketConformidadDatosInvalidosError(
      `El dato ${campo} es obligatorio.`,
    );
  }

  return recortado;
}

function textoOpcional(valor?: string | null): string | null {
  const recortado = valor?.trim();

  return recortado ? recortado : null;
}
