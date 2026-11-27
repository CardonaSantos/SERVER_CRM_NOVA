import { Injectable } from '@nestjs/common';
import {
  CredencialesUsuarioResult,
  PerfilSesionResult,
  UsuarioFacadePort,
} from '../../public/usuario.facade.port';
import { BuscarCredencialesUsuarioUseCase } from '../use-cases/buscar-credenciales-usuario.use-case';
import { ObtenerPerfilSesionUseCase } from '../use-cases/obtener-perfil-sesion.use-case';
import { VerificarContrasenaUsuarioUseCase } from '../use-cases/verificar-contrasena-usuario.use-case';

@Injectable()
export class UsuarioFacade implements UsuarioFacadePort {
  constructor(
    private readonly credenciales: BuscarCredencialesUsuarioUseCase,
    private readonly contrasena: VerificarContrasenaUsuarioUseCase,
    private readonly perfilSesion: ObtenerPerfilSesionUseCase,
  ) {}

  buscarCredenciales(
    correo: string,
  ): Promise<CredencialesUsuarioResult | null> {
    return this.credenciales.execute(correo);
  }

  verificarContrasena(usuarioId: number, contrasena: string): Promise<boolean> {
    return this.contrasena.execute({ usuarioId, contrasena });
  }

  obtenerPerfilSesion(usuarioId: number): Promise<PerfilSesionResult | null> {
    return this.perfilSesion.execute(usuarioId);
  }
}
