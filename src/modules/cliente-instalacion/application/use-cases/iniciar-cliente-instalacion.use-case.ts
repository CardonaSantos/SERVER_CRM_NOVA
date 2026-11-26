import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  ClienteInstalacionDatosInvalidosError,
  ClienteInstalacionNoEncontradaError,
} from '../../domain/errors/cliente-instalacion.errors';
import {
  CLIENTE_INSTALACION_REPOSITORY,
  ClienteInstalacionRepositoryPort,
} from '../../domain/ports/cliente-instalacion-repository.port';
import {
  ClienteInstalacionResumen,
  resumirInstalacion,
} from '../../domain/read-models/cliente-instalacion-resumen.read-model';

export type IniciarClienteInstalacionInput = {
  id: number;
  /** El técnico autenticado; solo puede iniciar lo que tiene asignado. */
  tecnicoId: number;
  /** Si el inicio ocurrió antes; por omisión, ahora. */
  fechaInicio?: string;
};

/**
 * Inicia únicamente el trabajo físico de campo: PROGRAMADA o REPROGRAMADA
 * pasa a EN_PROCESO. No prepara PPPoE, no abre SSH ni pide reautenticación.
 */
@Injectable()
export class IniciarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalaciones: ClienteInstalacionRepositoryPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: IniciarClienteInstalacionInput,
  ): Promise<ClienteInstalacionResumen> {
    const instalacion = await this.instalaciones.findByIdAssignedToTechnician({
      instalacionId: input.id,
      tecnicoId: input.tecnicoId,
    });

    // 404 y no 403: no se revela si existe una instalación de otro técnico.
    if (!instalacion) {
      throw new ClienteInstalacionNoEncontradaError();
    }

    // Repetir la petición no cambia la fecha de inicio ni vuelve a transitar.
    if (instalacion.isEnProceso) {
      return resumirInstalacion(instalacion);
    }

    instalacion.iniciar({ fechaInicio: this.resolverFecha(input.fechaInicio) });

    return resumirInstalacion(await this.instalaciones.save(instalacion));
  }

  private resolverFecha(valor?: string): Date {
    if (valor === undefined) {
      return this.reloj.ahora();
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      throw new ClienteInstalacionDatosInvalidosError(
        'fechaInicio debe contener una fecha válida.',
      );
    }

    return fecha;
  }
}
