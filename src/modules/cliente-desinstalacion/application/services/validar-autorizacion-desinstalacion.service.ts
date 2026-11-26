import { Inject, Injectable } from '@nestjs/common';
import { ClienteDesinstalacionAutorizacionEntity } from '../../domain/entities/cliente-desinstalacion-autorizacion.entity';
import { EstadoAutorizacionDesinstalacion } from '../../domain/enums/estado-autorizacion-desinstalacion.enum';
import { AutorizacionDesinstalacionConflictoError } from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY,
  ClienteDesinstalacionAutorizacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-autorizacion-repository.port';

const MENSAJE_POR_ESTADO: Partial<
  Record<EstadoAutorizacionDesinstalacion, string>
> = {
  [EstadoAutorizacionDesinstalacion.PENDIENTE]:
    'La autorización más reciente todavía está pendiente.',
  [EstadoAutorizacionDesinstalacion.RECHAZADA]:
    'La autorización más reciente fue rechazada.',
  [EstadoAutorizacionDesinstalacion.ANULADA]:
    'La autorización más reciente fue anulada.',
};

@Injectable()
export class ValidarAutorizacionDesinstalacionService {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY)
    private readonly autorizaciones: ClienteDesinstalacionAutorizacionRepositoryPort,
  ) {}

  /** La última autorización de la desinstalación debe estar aprobada. */
  async exigirAprobada(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity> {
    const ultima =
      await this.autorizaciones.findUltimaByDesinstalacionId(desinstalacionId);

    if (!ultima) {
      throw new AutorizacionDesinstalacionConflictoError(
        'La desinstalación requiere una autorización aprobada antes de iniciar.',
      );
    }

    if (ultima.estado !== EstadoAutorizacionDesinstalacion.APROBADA) {
      throw new AutorizacionDesinstalacionConflictoError(
        MENSAJE_POR_ESTADO[ultima.estado] ??
          'La autorización más reciente no permite iniciar la desinstalación.',
      );
    }

    return ultima;
  }
}
