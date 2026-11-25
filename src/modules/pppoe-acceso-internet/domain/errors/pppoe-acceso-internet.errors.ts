import { DomainError } from 'src/common/hexagonal/domain-error';

export class AccesoInternetNoEncontradoError extends DomainError {
  readonly codigo = 'ACCESO_INTERNET_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('No se encontró el acceso de internet.');
  }
}
