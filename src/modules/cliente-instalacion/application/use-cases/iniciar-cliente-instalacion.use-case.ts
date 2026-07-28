import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';
import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';
import { IniciarInstalacionClienteDto } from '../dto/iniciar-instalacion.dto';
export type IniciarInstalacionClienteCommand = IniciarInstalacionClienteDto & {
  id: number;
};

@Injectable()
export class IniciarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly clienteInstalacion: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(command: IniciarInstalacionClienteCommand) {
    const instalacion = await this.clienteInstalacion.findById({
      id: command.id,
    });

    if (!instalacion) {
      throw new NotFoundException(
        `No se encontró la instalación ${command.id}.`,
      );
    }

    const fechaInicio = this.parseFechaInicio(command.fechaInicio);

    instalacion.iniciar({
      fechaInicio,
    });

    return this.clienteInstalacion.save(instalacion);
  }

  private parseFechaInicio(
    value: string | Date | null | undefined,
  ): Date | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const fecha = new Date(value);

    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException(
        'fechaInicio debe contener una fecha válida.',
      );
    }

    return fecha;
  }
}
