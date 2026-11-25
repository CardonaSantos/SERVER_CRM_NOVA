import { DomainError } from 'src/common/hexagonal/domain-error';

export class ArchivoVacioError extends DomainError {
  readonly codigo = 'ARCHIVO_VACIO';
  readonly tipo = 'INVALIDO' as const;

  constructor() {
    super('El archivo está vacío.');
  }
}

export class TipoArchivoNoReconocidoError extends DomainError {
  readonly codigo = 'TIPO_ARCHIVO_NO_RECONOCIDO';
  readonly tipo = 'INVALIDO' as const;

  constructor() {
    super('No fue posible determinar el tipo del archivo.');
  }
}

export class SinArchivosError extends DomainError {
  readonly codigo = 'SIN_ARCHIVOS';
  readonly tipo = 'INVALIDO' as const;

  constructor() {
    super('No se recibió ningún archivo.');
  }
}

export class MetadatosArchivosInvalidosError extends DomainError {
  readonly codigo = 'METADATOS_ARCHIVOS_INVALIDOS';
  readonly tipo = 'INVALIDO' as const;

  constructor() {
    super('La descripción de los archivos (items) no es un JSON válido.');
  }
}

export class EmpresaRequeridaError extends DomainError {
  readonly codigo = 'EMPRESA_REQUERIDA';
  readonly tipo = 'INVALIDO' as const;

  constructor() {
    super('No se indicó la empresa del archivo.');
  }
}

export class MediaNoEncontradaError extends DomainError {
  readonly codigo = 'MEDIA_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO' as const;

  constructor() {
    super('El archivo no existe o ya fue eliminado.');
  }
}
