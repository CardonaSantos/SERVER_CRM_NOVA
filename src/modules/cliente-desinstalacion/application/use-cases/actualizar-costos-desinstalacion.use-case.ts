import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Money } from 'src/shared/domain/value-objects/money.vo';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';
import { ActualizarCostosDesinstalacionDto } from '../dto/actualizar-costos-desinstalacion.dto';

export type ActualizarCostosDesinstalacionCommand =
  ActualizarCostosDesinstalacionDto & {
    id: number;
  };

@Injectable()
export class ActualizarCostosDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,
  ) {}

  async execute(
    command: ActualizarCostosDesinstalacionCommand,
  ): Promise<ClienteDesinstalacionEntity> {
    const desinstalacion = await this.clienteDesinstalacionRepository.findById(
      command.id,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    desinstalacion.actualizarCostos({
      saldoClienteAlMomento:
        command.saldoClienteAlMomento !== undefined
          ? Money.fromNumber(command.saldoClienteAlMomento)
          : undefined,

      costoDesinstalacion:
        command.costoDesinstalacion !== undefined
          ? Money.fromNumber(command.costoDesinstalacion)
          : undefined,

      costoTransporte:
        command.costoTransporte !== undefined
          ? Money.fromNumber(command.costoTransporte)
          : undefined,

      costoManoObra:
        command.costoManoObra !== undefined
          ? Money.fromNumber(command.costoManoObra)
          : undefined,

      costoOtros:
        command.costoOtros !== undefined
          ? Money.fromNumber(command.costoOtros)
          : undefined,
    });

    return this.clienteDesinstalacionRepository.save(desinstalacion);
  }
}
