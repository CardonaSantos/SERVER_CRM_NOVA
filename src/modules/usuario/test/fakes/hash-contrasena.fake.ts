import { HashContrasenaPort } from '../../application/ports/hash-contrasena.port';

/** "Codifica" con un prefijo visible para poder comprobarlo. */
export class HashContrasenaFake implements HashContrasenaPort {
  hash(contrasena: string): Promise<string> {
    return Promise.resolve(`hash:${contrasena}`);
  }

  verify(contrasena: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hash:${contrasena}`);
  }
}
