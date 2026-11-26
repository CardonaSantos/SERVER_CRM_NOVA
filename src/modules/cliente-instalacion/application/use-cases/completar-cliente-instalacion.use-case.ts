import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  ClienteInstalacionDatosInvalidosError,
  ClienteInstalacionNoEncontradaError,
  ClienteInstalacionProhibidaError,
} from '../../domain/errors/cliente-instalacion.errors';
import {
  CLIENTE_INSTALACION_REPOSITORY,
  ClienteInstalacionRepositoryPort,
} from '../../domain/ports/cliente-instalacion-repository.port';
import {
  ClienteInstalacionResumen,
  resumirInstalacion,
} from '../../domain/read-models/cliente-instalacion-resumen.read-model';

export type CompletarClienteInstalacionInput = {
  id: number;
  /** Quien completa: el usuario autenticado, nunca un dato del cuerpo. */
  operadorId: number;
  /** Un técnico solo completa lo que tiene asignado; oficina completa cualquiera. */
  soloSiEstaAsignado: boolean;
  resultado?: string | null;
  observaciones?: string | null;
  fechaFinalizacion?: string | Date | null;
};

/**
 * Cierra el trabajo técnico: EN_PROCESO pasa a COMPLETADA. No ejecuta
 * operaciones PPPoE ni SSH ni toca `fechaActivacionServicio`.
 */
@Injectable()
export class CompletarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalaciones: ClienteInstalacionRepositoryPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CompletarClienteInstalacionInput,
  ): Promise<ClienteInstalacionResumen> {
    const instalacion = await this.instalaciones.findById(input.id);

    if (!instalacion) {
      throw new ClienteInstalacionNoEncontradaError();
    }

    if (input.soloSiEstaAsignado) {
      await this.exigirAsignacion(input);
    }

    // Repetir la petición devuelve lo ya completado sin transitar de nuevo.
    if (instalacion.isCompletada) {
      return resumirInstalacion(instalacion);
    }

    instalacion.completar({
      completadoPorId: input.operadorId,
      resultado: input.resultado ?? null,
      observaciones: input.observaciones ?? null,
      fechaFinalizacion: this.resolverFecha(input.fechaFinalizacion),
    });

    return resumirInstalacion(await this.instalaciones.save(instalacion));
  }

  private async exigirAsignacion(
    input: CompletarClienteInstalacionInput,
  ): Promise<void> {
    const asignada = await this.instalaciones.findByIdAssignedToTechnician({
      instalacionId: input.id,
      tecnicoId: input.operadorId,
    });

    if (!asignada) {
      throw new ClienteInstalacionProhibidaError(
        'Solo un técnico asignado a la instalación puede completarla.',
      );
    }
  }

  private resolverFecha(valor?: string | Date | null): Date {
    if (valor === undefined || valor === null) {
      return this.reloj.ahora();
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      throw new ClienteInstalacionDatosInvalidosError(
        'fechaFinalizacion debe contener una fecha válida.',
      );
    }

    return fecha;
  }
}
