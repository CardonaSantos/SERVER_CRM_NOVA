import { ReautenticacionUsuarioPort } from '../../application/ports/reautenticacion-usuario.port';

export class ContrasenaIncorrectaFake extends Error {}

/** Solo acepta `contrasenaValida`. */
export class ReautenticacionUsuarioFake implements ReautenticacionUsuarioPort {
  readonly confirmados: number[] = [];

  constructor(private readonly contrasenaValida = 'mia-actual') {}

  confirmar(usuarioId: number, contrasenaActual: string): Promise<void> {
    if (contrasenaActual !== this.contrasenaValida) {
      return Promise.reject(new ContrasenaIncorrectaFake());
    }
    this.confirmados.push(usuarioId);
    return Promise.resolve();
  }
}
