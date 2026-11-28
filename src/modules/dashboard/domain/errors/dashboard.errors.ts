import {
  DomainError,
  TipoErrorDominio,
} from 'src/common/hexagonal/domain-error';

export class DashboardRangoInvalidoError extends DomainError {
  readonly codigo = 'DASHBOARD_RANGO_INVALIDO';
  readonly tipo: TipoErrorDominio = 'INVALIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class DashboardUsuarioNoEncontradoError extends DomainError {
  readonly codigo = 'DASHBOARD_USUARIO_NO_ENCONTRADO';
  readonly tipo: TipoErrorDominio = 'NO_ENCONTRADO';

  constructor() {
    super('El usuario no existe.');
  }
}

export class FotoMensualInvalidaError extends DomainError {
  readonly codigo = 'DASHBOARD_FOTO_MENSUAL_INVALIDA';
  readonly tipo: TipoErrorDominio = 'INVALIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}
