import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { UsuarioNoEncontradoError } from '../../domain/errors/usuario.errors';
import { asegurarQueNoEsUnoMismo } from '../../domain/policies/super-admin.policy';
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

export type CambiarContrasenaUsuarioInput = {
  actorId: number;
  usuarioId: number;
  /** La de quien actúa. */
  contrasenaActual: string;
  contrasenaNueva: string;
};

export type CambiarContrasenaUsuarioResult = {
  usuarioId: number;
  sesionesCerradas: number;
};

/** Pone una contraseña nueva a otro usuario y cierra todas sus sesiones. */
@Injectable()
export class CambiarContrasenaUsuarioUseCase {
  private readonly logger = new Logger(CambiarContrasenaUsuarioUseCase.name);

  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(HASH_CONTRASENA) private readonly hash: HashContrasenaPort,
    @Inject(REAUTENTICACION_USUARIO)
    private readonly reautenticacion: ReautenticacionUsuarioPort,
    @Inject(SESIONES_USUARIO) private readonly sesiones: SesionesUsuarioPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CambiarContrasenaUsuarioInput,
  ): Promise<CambiarContrasenaUsuarioResult> {
    // La propia se cambia en /usuarios/yo/contrasena, pidiendo la actual.
    asegurarQueNoEsUnoMismo(input.actorId, input.usuarioId);
    await this.reautenticacion.confirmar(input.actorId, input.contrasenaActual);
    const contrasenaHash = await this.hash.hash(input.contrasenaNueva);

    await this.unidad.ejecutar(async () => {
      await this.usuarios.bloquearParaModificar(input.usuarioId);
      const usuario = await this.usuarios.findById(input.usuarioId);
      if (!usuario) throw new UsuarioNoEncontradoError();

      usuario.cambiarContrasena(contrasenaHash, this.reloj.ahora());
      await this.usuarios.update(usuario);
    });

    const sesionesCerradas = await this.sesiones.cerrarTodas(
      input.usuarioId,
      'CONTRASENA_CAMBIADA',
    );
    this.logger.log(
      `Contraseña del usuario ${input.usuarioId} cambiada por el usuario ${input.actorId}; ${sesionesCerradas} sesión(es) cerrada(s).`,
    );

    return { usuarioId: input.usuarioId, sesionesCerradas };
  }
}
