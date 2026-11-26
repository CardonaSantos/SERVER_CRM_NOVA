import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { ReautenticacionOperadorPort } from '../../application/ports/reautenticacion-operador.port';

@Injectable()
export class ReautenticacionAuthAdapter implements ReautenticacionOperadorPort {
  constructor(private readonly auth: AuthService) {}

  confirmar(usuarioId: number, contrasenaActual: string): Promise<void> {
    return this.auth.reautenticarUsuarioPorId(usuarioId, contrasenaActual);
  }
}
