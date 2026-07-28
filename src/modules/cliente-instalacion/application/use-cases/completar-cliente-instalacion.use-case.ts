import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';
import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';
import { CompletarClienteInstalacionDto } from '../dto/completar-cliente-instalacion.dto';

export type CompletarClienteInstalacion = CompletarClienteInstalacionDto & {
  id: number;
};

@Injectable()
export class CompletarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly clienteInstalacion: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(command: CompletarClienteInstalacion) {
    const instalacion = await this.clienteInstalacion.findById({
      id: command.id,
    });

    if (!instalacion) {
      throw new NotFoundException(
        `No se encontró la instalación ${command.id}.`,
      );
    }

    /**
     * Protección temporal.
     *
     * Se sustituirá por la llamada al puerto
     * PPPoE cuando integremos la automatización.
     */
    if (command.activarServicio === true) {
      throw new ConflictException(
        'La activación automática del servicio todavía no está integrada. Complete la instalación sin activar el servicio.',
      );
    }

    const fechaFinalizacion = this.parseFechaFinalizacion(
      command.fechaFinalizacion,
    );

    instalacion.completar({
      completadoPorId: command.completadoPorId,

      resultado: command.resultado ?? null,

      observaciones: command.observaciones ?? null,

      fechaFinalizacion,
    });

    return this.clienteInstalacion.save(instalacion);
  }

  private parseFechaFinalizacion(
    value: string | Date | null | undefined,
  ): Date | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const fecha = new Date(value);

    if (Number.isNaN(fecha.getTime())) {
      throw new ConflictException(
        'fechaFinalizacion debe contener una fecha válida.',
      );
    }

    return fecha;
  }
}
