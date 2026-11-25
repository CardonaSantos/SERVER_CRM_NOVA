import { DomainError } from 'src/common/hexagonal/domain-error';

export class PerfilHomologacionNoEncontradoError extends DomainError {
  readonly codigo = 'PERFIL_HOMOLOGACION_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('No se encontró la homologación PPPoE.');
  }
}

export class PerfilHomologacionDuplicadoError extends DomainError {
  readonly codigo = 'PERFIL_HOMOLOGACION_DUPLICADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super(
      'Ya existe una homologación para este MikroTik y servicio de internet.',
    );
  }
}

export class PerfilHomologacionCodigoDuplicadoError extends DomainError {
  readonly codigo = 'PERFIL_HOMOLOGACION_CODIGO_DUPLICADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super(
      'El código de perfil ya está homologado para otro servicio en este MikroTik.',
    );
  }
}
