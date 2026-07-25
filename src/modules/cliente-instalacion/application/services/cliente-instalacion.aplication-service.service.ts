import { Inject, Injectable } from '@nestjs/common';
import { CrearClienteInstalacionDto } from '../dto/crear-cliente-instalacion.dto';
import { FiltrarClienteInstalacionesDto } from '../dto/filtrar-cliente-instalaciones.dto';
import { CrearClienteInstalacionUseCase } from '../use-cases/crear-cliente-instalacion.use-case';
import { ListarClienteInstalacionesUseCase } from '../use-cases/listar-cliente-instalaciones.use-case';
import { ObtenerClienteInstalacionUseCase } from '../use-cases/obtener-cliente-instalacion.use-case';
import { ActualizarClienteInstalacionUseCase } from '../use-cases/actualizar-cliente-instalacion.use-case';
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
import {
  CrearClienteInstalacionResult,
  PrealtaPppoeInstalacionResult,
} from '../../results/crear-cliente-instalacion.result';
import { ReintentarPrealtaPppoeInstalacionUseCase } from '../use-cases/reintentar-prealta-pppoe-instalacion.use-case';
import { ReintentarPrealtaPppoeDto } from '../dto/reintentar-prealta-pppoe.dto';
import {
  PPPOE_CREDENCIALES_INSTALACION,
  PppoeCredencialesInstalacionPort,
} from 'src/modules/pppoe-automatizacion/domain/ports/pppoe-credenciales-instalacion.port';
import { ConsultarCredencialesPppoeInstalacionResult } from 'src/modules/pppoe-automatizacion/application/inputs/consultar-credenciales-pppoe-instalacion.result';

type ReintentarPrealtaPppoeServiceParams = {
  instalacionId: number;

  accesoInternetId: number;

  dto: ReintentarPrealtaPppoeDto;

  operadorId: number;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

type ConsultarCredencialesPppoeServiceParams = {
  instalacionId: number;

  operadorId: number;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

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

    private readonly reintentarPrealtaPppoeInstalacionUseCase: ReintentarPrealtaPppoeInstalacionUseCase,

    @Inject(PPPOE_CREDENCIALES_INSTALACION)
    private readonly credencialesPppoeInstalacion: PppoeCredencialesInstalacionPort,
  ) {}

  crear(
    dto: CrearClienteInstalacionDto,
    creadoPorId: number,
  ): Promise<CrearClienteInstalacionResult> {
    return this.crearClienteInstalacionUseCase.execute({
      ...dto,
      creadoPorId,
    });
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

  consultarCredencialesPppoe(
    params: ConsultarCredencialesPppoeServiceParams,
  ): Promise<ConsultarCredencialesPppoeInstalacionResult> {
    return this.credencialesPppoeInstalacion.consultar({
      instalacionId: params.instalacionId,

      operadorId: params.operadorId,

      operadorNombre: params.operadorNombre ?? null,

      ipOrigen: params.ipOrigen ?? null,

      userAgent: params.userAgent ?? null,
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

  obtener(id: number) {
    return this.obtenerClienteInstalacionUseCase.execute({
      id,
    });
  }

  reintentarPrealtaPppoe(
    params: ReintentarPrealtaPppoeServiceParams,
  ): Promise<PrealtaPppoeInstalacionResult> {
    return this.reintentarPrealtaPppoeInstalacionUseCase.execute({
      instalacionId: params.instalacionId,
      accesoInternetId: params.accesoInternetId,
      mikrotikRouterId: params.dto.mikrotikRouterId,
      operadorId: params.operadorId,
      operadorNombre: params.operadorNombre ?? null,
      ipOrigen: params.ipOrigen ?? null,
      userAgent: params.userAgent ?? null,
    });
  }
}
