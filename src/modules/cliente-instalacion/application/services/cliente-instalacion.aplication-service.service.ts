import { Injectable } from '@nestjs/common';
import { CrearClienteInstalacionDto } from '../dto/crear-cliente-instalacion.dto';
import { FiltrarClienteInstalacionesDto } from '../dto/filtrar-cliente-instalaciones.dto';
import { CrearClienteInstalacionUseCase } from '../use-cases/crear-cliente-instalacion.use-case';
import { ListarClienteInstalacionesUseCase } from '../use-cases/listar-cliente-instalaciones.use-case';
import { ObtenerClienteInstalacionUseCase } from '../use-cases/obtener-cliente-instalacion.use-case';
import { ActualizarClienteInstalacionUseCase } from '../use-cases/actualizar-cliente-instalacion.use-case';
import { dot } from 'node:test/reporters';
import { ActualizarClienteInstalacionDto } from '../dto/actualizar-cliente-instalacion.dto';
import { ReprogramarClienteInstalacionDto } from '../dto/reprogramar-cliente-instalacion.dto';
import { ReprogramarInstalacionClienteUseCase } from '../use-cases/reprogramar-cliente-instalacion.use-case';
import { IniciarInstalacionClienteDto } from '../dto/iniciar-instalacion.dto';
import { IniciarClienteInstalacionUseCase } from '../use-cases/iniciar-cliente-instalacion.use-case';
import { CompletarClienteInstalacionDto } from '../dto/completar-cliente-instalacion.dto';
import { CompletarClienteInstalacionUseCase } from '../use-cases/completar-cliente-instalacion.use-case';
import { CancelarClienteInstalacionDto } from '../dto/cancelar-cliente-instalacion.dto';
import { CancelarClienteInstalacionUseCase } from '../use-cases/cancelar-cliente-instalacion.use-case';
import {
  SubirEvidenciaInstalacionCommand,
  SubirEvidenciaInstalacionUseCase,
} from '../use-cases/subir-evidencia-instalacion.use-case';
import { DeleteAllClienteInstalacionUseCase } from '../use-cases/delete-all';

@Injectable()
export class ClienteInstalacionApplicationService {
  constructor(
    private readonly crearClienteInstalacionUseCase: CrearClienteInstalacionUseCase,
    private readonly listarClienteInstalacionesUseCase: ListarClienteInstalacionesUseCase,
    private readonly obtenerClienteInstalacionUseCase: ObtenerClienteInstalacionUseCase,
    private readonly actualizarClienteInstalacionUseCase: ActualizarClienteInstalacionUseCase,

    // BEHAVIORS
    private readonly reprogramarClienteInstalacionUseCase: ReprogramarInstalacionClienteUseCase,
    private readonly iniciarClienteInstalacionUseCase: IniciarClienteInstalacionUseCase,

    private readonly completarClienteInstalacionUseCase: CompletarClienteInstalacionUseCase,
    private readonly cancelarClienteInstalacionUseCase: CancelarClienteInstalacionUseCase,

    private readonly subirEvidenciaInstalacionUseCase: SubirEvidenciaInstalacionUseCase,

    //test
    private readonly deleteAllInstalacionUseCase: DeleteAllClienteInstalacionUseCase,
  ) {}

  crear(dto: CrearClienteInstalacionDto, creadoPorId: number) {
    // return this.crearClienteInstalacionUseCase.execute({
    //   ...dto,
    //   creadoPorId,
    // });
  }

  actualizar(
    id: number,
    empresaId: number,
    dto: ActualizarClienteInstalacionDto,
  ) {
    return this.actualizarClienteInstalacionUseCase.execute({
      id,
      empresaId,
      ...dto,
    });
  }

  listar(filters: FiltrarClienteInstalacionesDto) {
    return this.listarClienteInstalacionesUseCase.execute(filters);
  }

  obtener(id: number, empresaId: number) {
    return this.obtenerClienteInstalacionUseCase.execute({
      id,
      empresaId,
    });
  }

  // BEHAVIORS

  reprogramar(dto: ReprogramarClienteInstalacionDto, id: number) {
    return this.reprogramarClienteInstalacionUseCase.execute({
      ...dto,
      id,
    });
  }

  iniciar(dto: IniciarInstalacionClienteDto, id: number) {
    return this.iniciarClienteInstalacionUseCase.execute({
      id,
      fechaInicio: dto.fechaInicio,
    });
  }

  completar(dto: CompletarClienteInstalacionDto, id: number) {
    return this.completarClienteInstalacionUseCase.execute({
      ...dto,
      id,
    });
  }

  cancelar(dto: CancelarClienteInstalacionDto, id: number) {
    return this.cancelarClienteInstalacionUseCase.execute({
      ...dto,
      id,
    });
  }

  cargarEvidencias(dto: SubirEvidenciaInstalacionCommand) {
    return this.subirEvidenciaInstalacionUseCase.execute(dto);
  }

  deleteAll() {
    return this.deleteAllInstalacionUseCase.execute();
  }
}
