import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { ClienteDesinstalacionAutorizacionEntity } from '../../domain/entities/cliente-desintalacion-autorizacion.entitie';

import { ClienteDesinstalacionAutorizacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion-autorizacion.repository.port';

import { CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';
import { EstadoAutorizacionDesinstalacion } from '../../domain/enums/estado-autorizacion-desintalacion.enum';

@Injectable()
export class ValidarAutorizacionDesinstalacionService {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY)
    private readonly autorizacionRepository: ClienteDesinstalacionAutorizacionRepositoryPort,
  ) {}

  async exigirAprobada(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity> {
    const ultimaAutorizacion =
      await this.autorizacionRepository.findUltimaByDesinstalacionId(
        desinstalacionId,
      );

    if (!ultimaAutorizacion) {
      throw new ConflictException(
        'La desinstalación requiere una autorización aprobada antes de iniciar.',
      );
    }

    if (
      ultimaAutorizacion.estado !== EstadoAutorizacionDesinstalacion.APROBADA
    ) {
      throw new ConflictException(
        this.obtenerMensajeEstado(ultimaAutorizacion.estado),
      );
    }

    return ultimaAutorizacion;
  }

  private obtenerMensajeEstado(
    estado: EstadoAutorizacionDesinstalacion,
  ): string {
    switch (estado) {
      case EstadoAutorizacionDesinstalacion.PENDIENTE:
        return 'La autorización más reciente todavía está pendiente.';

      case EstadoAutorizacionDesinstalacion.RECHAZADA:
        return 'La autorización más reciente fue rechazada.';

      case EstadoAutorizacionDesinstalacion.ANULADA:
        return 'La autorización más reciente fue anulada.';

      default:
        return 'La autorización más reciente no permite iniciar la desinstalación.';
    }
  }
}
