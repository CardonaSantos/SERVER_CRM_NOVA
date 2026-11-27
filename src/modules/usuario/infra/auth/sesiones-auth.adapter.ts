import { Injectable, Logger } from '@nestjs/common';
import { MOTIVO_REVOCACION } from 'src/auth/sesiones/sesion.constants';
import { SesionesService } from 'src/auth/sesiones/sesiones.service';
import {
  MotivoCierreSesiones,
  SesionesUsuarioPort,
} from '../../application/ports/sesiones-usuario.port';

const MOTIVO = {
  USUARIO_INACTIVO: MOTIVO_REVOCACION.USUARIO_INACTIVO,
  CONTRASENA_CAMBIADA: MOTIVO_REVOCACION.CONTRASENA_CAMBIADA,
} as const;

/** Revoca sesiones y refresh; el evento de `auth` desconecta los sockets. */
@Injectable()
export class SesionesAuthAdapter implements SesionesUsuarioPort {
  private readonly logger = new Logger(SesionesAuthAdapter.name);

  constructor(private readonly sesiones: SesionesService) {}

  cerrarTodas(
    usuarioId: number,
    motivo: MotivoCierreSesiones,
  ): Promise<number> {
    return this.revocar(usuarioId, null, motivo);
  }

  cerrarOtras(
    usuarioId: number,
    sesionId: string,
    motivo: MotivoCierreSesiones,
  ): Promise<number> {
    return this.revocar(usuarioId, sesionId || null, motivo);
  }

  private async revocar(
    usuarioId: number,
    excepto: string | null,
    motivo: MotivoCierreSesiones,
  ): Promise<number> {
    try {
      return await this.sesiones.revocarOtras(
        usuarioId,
        excepto,
        MOTIVO[motivo],
      );
    } catch (error) {
      // El guard rechaza igual a un inactivo; el cambio ya quedó guardado.
      this.logger.error(
        `No se pudieron cerrar las sesiones del usuario ${usuarioId}: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
      return 0;
    }
  }
}
