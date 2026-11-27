import { Injectable } from '@nestjs/common';
import { MiPerfil, MiPerfilService } from '../services/mi-perfil.service';

@Injectable()
export class ObtenerMiPerfilUseCase {
  constructor(private readonly miPerfil: MiPerfilService) {}

  execute(usuarioId: number): Promise<MiPerfil> {
    return this.miPerfil.cargar(usuarioId);
  }
}
