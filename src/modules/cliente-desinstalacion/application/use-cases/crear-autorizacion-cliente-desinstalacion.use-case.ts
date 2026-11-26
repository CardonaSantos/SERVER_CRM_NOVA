import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { ClienteDesinstalacionAutorizacionEntity } from '../../domain/entities/cliente-desinstalacion-autorizacion.entity';
import { EstadoAutorizacionDesinstalacion } from '../../domain/enums/estado-autorizacion-desinstalacion.enum';
import {
  AutorizacionDesinstalacionConflictoError,
  ClienteDesinstalacionNoEncontradaError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY,
  ClienteDesinstalacionAutorizacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-autorizacion-repository.port';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  AutorizacionDesinstalacionResumen,
  resumirAutorizacion,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';

export type CrearAutorizacionDesinstalacionInput = {
  desinstalacionId: number;
  solicitadoPorId: number;
  motivoSolicitud?: string | null;
};

const MENSAJE_POR_ESTADO: Partial<
  Record<EstadoAutorizacionDesinstalacion, string>
> = {
  [EstadoAutorizacionDesinstalacion.PENDIENTE]:
    'Ya existe una autorización pendiente para esta desinstalación.',
  [EstadoAutorizacionDesinstalacion.APROBADA]:
    'La desinstalación ya cuenta con una autorización aprobada.',
};

@Injectable()
export class CrearAutorizacionDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY)
    private readonly autorizaciones: ClienteDesinstalacionAutorizacionRepositoryPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CrearAutorizacionDesinstalacionInput,
  ): Promise<AutorizacionDesinstalacionResumen> {
    const desinstalacion = await this.desinstalaciones.findById(
      input.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    if (desinstalacion.isFinalizada) {
      throw new AutorizacionDesinstalacionConflictoError(
        'No se puede crear autorización para una desinstalación finalizada.',
      );
    }

    const ultima = await this.autorizaciones.findUltimaByDesinstalacionId(
      input.desinstalacionId,
    );
    const mensaje = ultima && MENSAJE_POR_ESTADO[ultima.estado];

    if (mensaje) {
      throw new AutorizacionDesinstalacionConflictoError(mensaje);
    }

    const creada = await this.autorizaciones.create(
      ClienteDesinstalacionAutorizacionEntity.create(
        {
          desinstalacionId: input.desinstalacionId,
          solicitadoPorId: input.solicitadoPorId,
          motivoSolicitud: input.motivoSolicitud ?? null,
        },
        this.reloj.ahora(),
      ),
    );

    return resumirAutorizacion(creada);
  }
}
