import { Injectable } from '@nestjs/common';

import {
  PppoeOperacionAgregadoReadModel,
  PppoeOperacionReadModel,
  aPppoeOperacionAgregadoReadModel,
  aPppoeOperacionReadModel,
} from '../../domain/read-models/pppoe-operacion-agregado.read-model';
import {
  PppoeOperacionDetalle,
  PppoeOperacionPaginatedResult,
} from '../../domain/read-models/pppoe-operacion.read-model';
import {
  PppoeOperacionCreadaReadModel,
  PppoeOperacionFacadePort,
  PppoeOperacionReintentoReadModel,
} from '../../public/pppoe-operacion.facade.port';
import {
  ActualizarPasoPppoeOperacionUseCase,
  ActualizarPasoPppoeOperacionUseCaseInput,
} from '../use-cases/actualizar-paso-pppoe-operacion.use-case';
import {
  AutorizarPppoeOperacionUseCase,
  AutorizarPppoeOperacionUseCaseInput,
} from '../use-cases/autorizar-pppoe-operacion.use-case';
import {
  BuscarAgregadoPppoeOperacionUseCase,
  BuscarAgregadoPppoeOperacionUseCaseInput,
} from '../use-cases/buscar-agregado-pppoe-operacion.use-case';
import {
  BuscarPppoeOperacionUseCase,
  BuscarPppoeOperacionUseCaseInput,
} from '../use-cases/buscar-pppoe-operacion.use-case';
import {
  CancelarPppoeOperacionUseCase,
  CancelarPppoeOperacionUseCaseInput,
} from '../use-cases/cancelar-pppoe-operacion.use-case';
import {
  CrearPppoeOperacionUseCase,
  CrearPppoeOperacionUseCaseInput,
} from '../use-cases/crear-pppoe-operacion.use-case';
import {
  CrearReintentoPppoeOperacionUseCase,
  CrearReintentoPppoeOperacionUseCaseInput,
} from '../use-cases/crear-reintento-pppoe-operacion.use-case';
import {
  FinalizarPppoeOperacionUseCase,
  FinalizarPppoeOperacionUseCaseInput,
} from '../use-cases/finalizar-pppoe-operacion.use-case';
import {
  IniciarPppoeOperacionUseCase,
  IniciarPppoeOperacionUseCaseInput,
} from '../use-cases/iniciar-pppoe-operacion.use-case';
import {
  ListarPppoeOperacionesUseCase,
  ListarPppoeOperacionesUseCaseInput,
} from '../use-cases/listar-pppoe-operaciones.use-case';
import {
  ObtenerDetallePppoeOperacionUseCase,
  ObtenerDetallePppoeOperacionUseCaseInput,
} from '../use-cases/obtener-detalle-pppoe-operacion.use-case';

@Injectable()
export class PppoeOperacionFacade implements PppoeOperacionFacadePort {
  constructor(
    private readonly crearOperacion: CrearPppoeOperacionUseCase,
    private readonly autorizarOperacion: AutorizarPppoeOperacionUseCase,
    private readonly iniciarOperacion: IniciarPppoeOperacionUseCase,
    private readonly actualizarPasoOperacion: ActualizarPasoPppoeOperacionUseCase,
    private readonly finalizarOperacion: FinalizarPppoeOperacionUseCase,
    private readonly cancelarOperacion: CancelarPppoeOperacionUseCase,
    private readonly crearReintentoOperacion: CrearReintentoPppoeOperacionUseCase,
    private readonly listarOperaciones: ListarPppoeOperacionesUseCase,
    private readonly obtenerDetalleOperacion: ObtenerDetallePppoeOperacionUseCase,
    private readonly buscarOperacion: BuscarPppoeOperacionUseCase,
    private readonly buscarAgregadoOperacion: BuscarAgregadoPppoeOperacionUseCase,
  ) {}

  async buscar(
    input: BuscarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionReadModel | null> {
    const operacion = await this.buscarOperacion.execute(input);
    return operacion ? aPppoeOperacionReadModel(operacion) : null;
  }

  async buscarAgregado(
    input: BuscarAgregadoPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAgregadoReadModel | null> {
    const agregado = await this.buscarAgregadoOperacion.execute(input);
    return agregado ? aPppoeOperacionAgregadoReadModel(agregado) : null;
  }

  async crear(
    input: CrearPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionCreadaReadModel> {
    const r = await this.crearOperacion.execute(input);
    return { ...aPppoeOperacionAgregadoReadModel(r), creada: r.creada };
  }

  async autorizar(
    input: AutorizarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionReadModel> {
    return aPppoeOperacionReadModel(
      await this.autorizarOperacion.execute(input),
    );
  }

  async iniciar(
    input: IniciarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAgregadoReadModel> {
    return aPppoeOperacionAgregadoReadModel(
      await this.iniciarOperacion.execute(input),
    );
  }

  async actualizarPaso(
    input: ActualizarPasoPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAgregadoReadModel> {
    return aPppoeOperacionAgregadoReadModel(
      await this.actualizarPasoOperacion.execute(input),
    );
  }

  async finalizar(
    input: FinalizarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAgregadoReadModel> {
    return aPppoeOperacionAgregadoReadModel(
      await this.finalizarOperacion.execute(input),
    );
  }

  async cancelar(
    input: CancelarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAgregadoReadModel> {
    return aPppoeOperacionAgregadoReadModel(
      await this.cancelarOperacion.execute(input),
    );
  }

  async crearReintento(
    input: CrearReintentoPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionReintentoReadModel> {
    const r = await this.crearReintentoOperacion.execute(input);
    return {
      ...aPppoeOperacionAgregadoReadModel(r),
      creada: r.creada,
      operacionAnteriorId: r.operacionAnteriorId,
    };
  }

  listar(
    input: ListarPppoeOperacionesUseCaseInput,
  ): Promise<PppoeOperacionPaginatedResult> {
    return this.listarOperaciones.execute(input);
  }

  obtenerDetalle(
    input: ObtenerDetallePppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionDetalle> {
    return this.obtenerDetalleOperacion.execute(input);
  }
}
