import { DomainError } from 'src/common/hexagonal/domain-error';

export class UsuarioNoEncontradoError extends DomainError {
  readonly codigo = 'USUARIO_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Usuario no encontrado.');
  }
}

export class UsuarioInvalidoError extends DomainError {
  readonly codigo = 'USUARIO_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class UsuarioCorreoDuplicadoError extends DomainError {
  readonly codigo = 'USUARIO_CORREO_DUPLICADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('Ya existe un usuario con ese correo.');
  }
}

export class UsuarioCorreoEnUsoError extends DomainError {
  readonly codigo = 'USUARIO_CORREO_EN_USO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super(
      'El correo de este usuario ya lo usa otra cuenta. Indique otro para restaurarlo.',
    );
  }
}

export class UsuarioEliminadoError extends DomainError {
  readonly codigo = 'USUARIO_ELIMINADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El usuario está eliminado. Restáurelo para modificarlo.');
  }
}

export class UsuarioNoEliminadoError extends DomainError {
  readonly codigo = 'USUARIO_NO_ELIMINADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El usuario no está eliminado.');
  }
}

export class UsuarioAccionSobreSiMismoError extends DomainError {
  readonly codigo = 'USUARIO_ACCION_SOBRE_SI_MISMO';
  readonly tipo = 'PROHIBIDO';
  constructor() {
    super(
      'No puede desactivar, eliminar, cambiar el rol ni la contraseña de su propia cuenta desde aquí.',
    );
  }
}

export class UsuarioUltimoSuperAdminError extends DomainError {
  readonly codigo = 'USUARIO_ULTIMO_SUPER_ADMIN';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('Debe quedar al menos un super administrador activo.');
  }
}

export class UsuarioModificadoError extends DomainError {
  readonly codigo = 'USUARIO_MODIFICADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El usuario cambió mientras se guardaba. Vuelva a intentarlo.');
  }
}

export class ImagenPerfilInvalidaError extends DomainError {
  readonly codigo = 'USUARIO_IMAGEN_INVALIDA';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}
