import { DomainError, esDomainError } from './domain-error';

class RecursoNoEncontradoError extends DomainError {
  readonly codigo = 'RECURSO_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO' as const;

  constructor(causa?: unknown) {
    super('Recurso no encontrado.', { causa });
  }
}

describe('DomainError', () => {
  it('conserva mensaje, código, tipo y nombre de la subclase', () => {
    const error = new RecursoNoEncontradoError();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
    expect(error.message).toBe('Recurso no encontrado.');
    expect(error.codigo).toBe('RECURSO_NO_ENCONTRADO');
    expect(error.tipo).toBe('NO_ENCONTRADO');
    expect(error.name).toBe('RecursoNoEncontradoError');
  });

  it('guarda la causa técnica sin mezclarla en el mensaje', () => {
    const causa = new Error('P2025 detalle interno');
    const error = new RecursoNoEncontradoError(causa);

    expect(error.causa).toBe(causa);
    expect(error.message).not.toContain('P2025');
  });

  it('valida el formato UPPER_SNAKE del código', () => {
    expect(DomainError.esCodigoValido('CONFLICTO')).toBe(true);
    expect(DomainError.esCodigoValido('CUENTA_PPPOE_ESTADO_INVALIDO')).toBe(
      true,
    );
    expect(DomainError.esCodigoValido('conflicto')).toBe(false);
    expect(DomainError.esCodigoValido('CON FLICTO')).toBe(false);
    expect(DomainError.esCodigoValido('_CONFLICTO')).toBe(false);
    expect(DomainError.esCodigoValido(42)).toBe(false);
  });

  it('esDomainError distingue errores de dominio de errores genéricos', () => {
    expect(esDomainError(new RecursoNoEncontradoError())).toBe(true);
    expect(esDomainError(new Error('x'))).toBe(false);
    expect(esDomainError('texto')).toBe(false);
    expect(esDomainError(null)).toBe(false);

    const imitacion = Object.assign(new Error('x'), {
      codigo: 'ALGO',
      tipo: 'CONFLICTO',
    });
    expect(esDomainError(imitacion)).toBe(true);

    const tipoInvalido = Object.assign(new Error('x'), {
      codigo: 'ALGO',
      tipo: 'RARO',
    });
    expect(esDomainError(tipoInvalido)).toBe(false);
  });
});
