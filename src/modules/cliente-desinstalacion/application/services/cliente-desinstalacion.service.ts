import { Injectable } from '@nestjs/common';

import { CrearClienteDesinstalacionDto } from '../dto/create-desinstalacion-cliente.dto';
import { ActualizarClienteDesinstalacionDto } from '../dto/actualizar-desinstalacion-cliente.dto';
import { FiltrarClienteDesinstalacionesDto } from '../dto/filtrar-cliente-desinstalaciones.dto';
import { ReprogramarClienteDesinstalacionDto } from '../dto/reprogramar-cliente-desinstalacion.dto';
import { IniciarClienteDesinstalacionDto } from '../dto/iniciar-cliente-desinstalacion.dto';
import { CompletarClienteDesinstalacionDto } from '../dto/completar-cliente-desinstalacion.dto';
import { CancelarClienteDesinstalacionDto } from '../dto/cancelar-cliente-desinstalacion.dto';
import { ActualizarCostosDesinstalacionDto } from '../dto/actualizar-costos-desinstalacion.dto';
import {
  AprobarDesinstalacionAutorizacionDto,
  RechazarDesinstalacionAutorizacionDto,
  SolicitarDesinstalacionAutorizacionDto,
} from '../dto/autorizacion-desinstalacion.dto';
import { CrearDesinstalacionUseCase } from '../use-cases/crear-desinstalacion.use-case';
import { ListarClienteDesinstalacionesUseCase } from '../use-cases/listar-clientes-desinstalaciones.use-case';
import { ObtenerClienteDesinstalacionUseCase } from '../use-cases/obtener-cliente-desinstalacion.use-case';
import { ActualizarClienteDesinstalacionUseCase } from '../use-cases/actualizar-desinstalacion-cliente.dto';
import { ReprogramarClienteDesinstalacionUseCase } from '../use-cases/reprogramar-desinstalacion.use-case';
import { IniciarClienteDesinstalacionUseCase } from '../use-cases/iniciar-cliente-desintalacion.use-case';
import { CompletarClienteDesinstalacionUseCase } from '../use-cases/completar-cliente-desinstalacion.use-case';
import { CancelarClienteDesinstalacionUseCase } from '../use-cases/cancelar-cliente-desinstalacion.use-case';
import { ActualizarCostosDesinstalacionUseCase } from '../use-cases/actualizar-costos-desinstalacion.use-case';
import { CrearAutorizacionDesinstalacionUseCase } from '../use-cases/crear-autorizacion-cliente-desinstalacion.use-case';
import { ListarAutorizacionesPendientesUseCase } from '../use-cases/listar-autorizacion-cliente-desintalacion.use-case';
import { AprobarAutorizacionDesinstalacionUseCase } from '../use-cases/aprobar-autorizacion-cliente-desinstalacion.use-case';
import { RechazarAutorizacionDesinstalacionUseCase } from '../use-cases/rechazar-autorizacion-cliente-desinstalacion.use-case';
import { AsignarTecnicoDesinstalacionUseCase } from '../use-cases/asignar-tecnico-desinstalacion.use-case';
import { ListarTecnicosDesinstalacionUseCase } from '../use-cases/listar-tecnicos-desintalacion.use-case';
import { EliminarTecnicoDesinstalacionUseCase } from '../use-cases/eliminar-tecnico-desinstalacion.use-case';
import { AsignarTecnicoDesinstalacionDto } from '../dto/tecnico-desinstalacion.dto';
import { MarcarFallidaClienteDesinstalacionUseCase } from '../use-cases/marcar-fallida-cliente-desinstalacion.use-case';
import { MarcarFallidaClienteDesinstalacionDto } from '../dto/marcar-fallida-cliente-desinstalacion.dto';

@Injectable()
export class ClienteDesInstalacionApplicationService {
  constructor(
    private readonly marcarFallidaUseCase: MarcarFallidaClienteDesinstalacionUseCase,
    private readonly crearDesinstalacionUseCase: CrearDesinstalacionUseCase,
    private readonly listarClienteDesinstalacionesUseCase: ListarClienteDesinstalacionesUseCase,
    private readonly obtenerClienteDesinstalacionUseCase: ObtenerClienteDesinstalacionUseCase,
    private readonly actualizarClienteDesinstalacionUseCase: ActualizarClienteDesinstalacionUseCase,
    private readonly reprogramarClienteDesinstalacionUseCase: ReprogramarClienteDesinstalacionUseCase,
    private readonly iniciarClienteDesinstalacionUseCase: IniciarClienteDesinstalacionUseCase,
    private readonly completarClienteDesinstalacionUseCase: CompletarClienteDesinstalacionUseCase,
    private readonly cancelarClienteDesinstalacionUseCase: CancelarClienteDesinstalacionUseCase,
    private readonly actualizarCostosDesinstalacionUseCase: ActualizarCostosDesinstalacionUseCase,
    // private readonly registrarFirmaDesinstalacionUseCase: RegistrarFirmaDesinstalacionUseCase,

    private readonly crearAutorizacionDesinstalacionUseCase: CrearAutorizacionDesinstalacionUseCase,
    private readonly listarAutorizacionesPendientesUseCase: ListarAutorizacionesPendientesUseCase,
    private readonly aprobarAutorizacionDesinstalacionUseCase: AprobarAutorizacionDesinstalacionUseCase,
    private readonly rechazarAutorizacionDesinstalacionUseCase: RechazarAutorizacionDesinstalacionUseCase,

    private readonly asignarTecnicoDesinstalacionUseCase: AsignarTecnicoDesinstalacionUseCase,
    private readonly listarTecnicosDesinstalacionUseCase: ListarTecnicosDesinstalacionUseCase,
    private readonly eliminarTecnicoDesinstalacionUseCase: EliminarTecnicoDesinstalacionUseCase,
  ) {}

  crear(dto: CrearClienteDesinstalacionDto, creadoPorId: number) {
    return this.crearDesinstalacionUseCase.execute({
      ...dto,
      creadoPorId,
    });
  }

  listar(filters: FiltrarClienteDesinstalacionesDto) {
    return this.listarClienteDesinstalacionesUseCase.execute(filters);
  }

  obtener(id: number) {
    return this.obtenerClienteDesinstalacionUseCase.execute({
      id,
    });
  }

  actualizar(id: number, dto: ActualizarClienteDesinstalacionDto) {
    return this.actualizarClienteDesinstalacionUseCase.execute({
      id,
      ...dto,
    });
  }

  marcarFallida(id: number, dto: MarcarFallidaClienteDesinstalacionDto) {
    return this.marcarFallidaUseCase.execute({
      id,
      ...dto,
    });
  }

  reprogramar(id: number, dto: ReprogramarClienteDesinstalacionDto) {
    return this.reprogramarClienteDesinstalacionUseCase.execute({
      id,
      ...dto,
    });
  }

  iniciar(
    id: number,
    dto: IniciarClienteDesinstalacionDto,
    ejecutadoPorId: number,
  ) {
    return this.iniciarClienteDesinstalacionUseCase.execute({
      id,
      ...dto,
      ejecutadoPorId,
    });
  }

  completar(id: number, dto: CompletarClienteDesinstalacionDto) {
    return this.completarClienteDesinstalacionUseCase.execute({
      id,
      ...dto,
    });
  }

  cancelar(id: number, dto: CancelarClienteDesinstalacionDto) {
    return this.cancelarClienteDesinstalacionUseCase.execute({
      id,
      ...dto,
    });
  }

  actualizarCostos(id: number, dto: ActualizarCostosDesinstalacionDto) {
    return this.actualizarCostosDesinstalacionUseCase.execute({
      id,
      ...dto,
    });
  }

  // registrarFirma(id: number, dto: RegistrarFirmaDesinstalacionDto) {
  //   return this.registrarFirmaDesinstalacionUseCase.execute({
  //     id,
  //     ...dto,
  //   });
  // }

  crearAutorizacion(
    desinstalacionId: number,
    dto: SolicitarDesinstalacionAutorizacionDto,
    solicitadoPorId: number,
  ) {
    return this.crearAutorizacionDesinstalacionUseCase.execute({
      desinstalacionId,
      solicitadoPorId,
      ...dto,
    });
  }

  listarAutorizacionesPendientes() {
    return this.listarAutorizacionesPendientesUseCase.execute();
  }

  aprobarAutorizacion(
    id: number,
    dto: AprobarDesinstalacionAutorizacionDto,
    autorizadoPorId: number,
  ) {
    return this.aprobarAutorizacionDesinstalacionUseCase.execute({
      id,
      autorizadoPorId,
      ...dto,
    });
  }

  rechazarAutorizacion(
    id: number,
    dto: RechazarDesinstalacionAutorizacionDto,
    autorizadoPorId: number,
  ) {
    return this.rechazarAutorizacionDesinstalacionUseCase.execute({
      id,
      autorizadoPorId,
      ...dto,
    });
  }

  // TECNICOS
  asignarTecnico(id: number, dto: AsignarTecnicoDesinstalacionDto) {
    return this.asignarTecnicoDesinstalacionUseCase.execute({
      desinstalacionId: id,
      ...dto,
    });
  }

  listarTecnicos(id: number) {
    return this.listarTecnicosDesinstalacionUseCase.execute(id);
  }

  eliminarTecnico(id: number, tecnicoOperacionId: number) {
    return this.eliminarTecnicoDesinstalacionUseCase.execute({
      desinstalacionId: id,
      tecnicoOperacionId,
    });
  }
}
