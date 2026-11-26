import { Inject, Injectable } from '@nestjs/common';
import { RolTecnicoOperacionCliente } from 'src/modules/cliente-instalacion/public/cliente-instalacion.types';
import { ClienteDesinstalacionTecnicoEntity } from '../../domain/entities/cliente-desinstalacion-tecnico.entity';
import {
  ClienteDesinstalacionNoEncontradaError,
  TecnicoDesinstalacionConflictoError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import { exigirSinResponsableActual } from '../../domain/policies/tecnicos-desinstalacion.policy';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  CLIENTE_DESINSTALACION_TECNICO_REPOSITORY,
  ClienteDesinstalacionTecnicoRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-tecnico-repository.port';
import {
  resumirTecnico,
  TecnicoDesinstalacionResumen,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';

export type AsignarTecnicoDesinstalacionInput = {
  desinstalacionId: number;
  tecnicoId?: number | null;
  rol?: RolTecnicoOperacionCliente;
  esResponsable?: boolean;
  tiempoMinutos?: number | null;
  observaciones?: string | null;
  tecnicoNombreSnapshot?: string | null;
};

@Injectable()
export class AsignarTecnicoDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_TECNICO_REPOSITORY)
    private readonly tecnicos: ClienteDesinstalacionTecnicoRepositoryPort,
  ) {}

  async execute(
    input: AsignarTecnicoDesinstalacionInput,
  ): Promise<TecnicoDesinstalacionResumen> {
    const desinstalacion = await this.desinstalaciones.findById(
      input.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    if (desinstalacion.isFinalizada) {
      throw new TecnicoDesinstalacionConflictoError(
        'No se pueden asignar técnicos a una desinstalación finalizada.',
      );
    }

    if (input.esResponsable) {
      exigirSinResponsableActual(
        await this.tecnicos.findByDesinstalacionId(input.desinstalacionId),
      );
    }

    const creado = await this.tecnicos.create(
      ClienteDesinstalacionTecnicoEntity.create({
        desinstalacionId: input.desinstalacionId,
        tecnicoId: input.tecnicoId ?? null,
        rol: input.rol,
        esResponsable: input.esResponsable ?? false,
        tiempoMinutos: input.tiempoMinutos ?? null,
        observaciones: input.observaciones ?? null,
        tecnicoNombreSnapshot: input.tecnicoNombreSnapshot ?? null,
      }),
    );

    return resumirTecnico(creado);
  }
}
