import { Inject, Injectable } from '@nestjs/common';
import {
  ServicioAdicionalInactivoError,
  ServicioAdicionalNoEncontradoError,
} from '../../domain/errors/servicio.errors';
import {
  SERVICIO_ADICIONAL_REPOSITORY,
  ServicioAdicionalRepositoryPort,
} from '../../domain/ports/servicio-adicional-repository.port';
import { VerificarServiciosAsignablesInput } from '../../public/servicio.facade.port';

/**
 * Confirma que unos servicios adicionales pueden asignarse y, dentro de una
 * unidad de trabajo, impide que se eliminen hasta que esta termine.
 */
@Injectable()
export class VerificarServiciosAsignablesUseCase {
  constructor(
    @Inject(SERVICIO_ADICIONAL_REPOSITORY)
    private readonly servicios: ServicioAdicionalRepositoryPort,
  ) {}

  async execute(input: VerificarServiciosAsignablesInput): Promise<void> {
    // Siempre en el mismo orden, para que dos asignaciones no se crucen.
    const ids = [...new Set(input.servicioIds)].sort((a, b) => a - b);

    for (const id of ids) {
      await this.servicios.bloquearParaAsignar(id);
      const servicio = await this.servicios.findById(id);
      if (!servicio) throw new ServicioAdicionalNoEncontradoError();
      servicio.asegurarVigente();

      if (servicio.activo) continue;

      const yaLoTiene =
        input.clienteId !== undefined &&
        (await this.servicios.clienteTieneServicio(id, input.clienteId));
      if (!yaLoTiene) throw new ServicioAdicionalInactivoError();
    }
  }
}
