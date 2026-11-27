import { Inject, Injectable } from '@nestjs/common';
import { UsuarioInvalidoError } from '../../domain/errors/usuario.errors';
import { normalizarCorreo } from '../../domain/policies/datos-usuario.policy';
import {
  USUARIO_QUERY,
  UsuarioQueryPort,
} from '../../domain/ports/usuario-query.port';
import { CredencialesUsuario } from '../../domain/read-models/usuario-listado.read-model';

/** Para el login: quién tiene ese correo, sin eliminados. */
@Injectable()
export class BuscarCredencialesUsuarioUseCase {
  constructor(
    @Inject(USUARIO_QUERY) private readonly consultas: UsuarioQueryPort,
  ) {}

  async execute(correo: string): Promise<CredencialesUsuario | null> {
    try {
      return await this.consultas.findCredenciales(normalizarCorreo(correo));
    } catch (error) {
      // Un correo mal escrito es "no existe": el login no distingue.
      if (error instanceof UsuarioInvalidoError) return null;
      throw error;
    }
  }
}
