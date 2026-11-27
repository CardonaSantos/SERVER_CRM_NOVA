import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';
import {
  HASH_CONTRASENA,
  HashContrasenaPort,
} from '../ports/hash-contrasena.port';
import {
  REAUTENTICACION_USUARIO,
  ReautenticacionUsuarioPort,
} from '../ports/reautenticacion-usuario.port';
import {
  SESIONES_USUARIO,
  SesionesUsuarioPort,
} from '../ports/sesiones-usuario.port';
import { MiPerfilService } from '../services/mi-perfil.service';

export type CambiarMiContrasenaInput = {
  usuarioId: number;
  /** Se conserva; las demás se cierran. */
  sesionId: string;
  contrasenaActual: string;
  contrasenaNueva: string;
};

export type CambiarMiContrasenaResult = { sesionesCerradas: number };

@Injectable()
export class CambiarMiContrasenaUseCase {
  private readonly logger = new Logger(CambiarMiContrasenaUseCase.name);

  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(HASH_CONTRASENA) private readonly hash: HashContrasenaPort,
    @Inject(REAUTENTICACION_USUARIO)
    private readonly reautenticacion: ReautenticacionUsuarioPort,
    @Inject(SESIONES_USUARIO) private readonly sesiones: SesionesUsuarioPort,
    private readonly miPerfil: MiPerfilService,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CambiarMiContrasenaInput,
  ): Promise<CambiarMiContrasenaResult> {
    await this.reautenticacion.confirmar(
      input.usuarioId,
      input.contrasenaActual,
    );
    const contrasenaHash = await this.hash.hash(input.contrasenaNueva);

    await this.unidad.ejecutar(async () => {
      await this.usuarios.bloquearParaModificar(input.usuarioId);
      const usuario = await this.miPerfil.usuarioVigente(input.usuarioId);
      usuario.cambiarContrasena(contrasenaHash, this.reloj.ahora());
      await this.usuarios.update(usuario);
    });

    const sesionesCerradas = await this.sesiones.cerrarOtras(
      input.usuarioId,
      input.sesionId,
      'CONTRASENA_CAMBIADA',
    );
    this.logger.log(
      `El usuario ${input.usuarioId} cambió su contraseña; ${sesionesCerradas} sesión(es) cerrada(s).`,
    );

    return { sesionesCerradas };
  }
}
