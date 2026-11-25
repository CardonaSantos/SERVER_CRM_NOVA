import { Injectable } from '@nestjs/common';

import { ClientePppoeCuentaReadModel } from '../../domain/read-models/cliente-pppoe-cuenta.read-model';
import { ClientePppoeCuentaDetalleResult } from '../../domain/read-models/cliente-pppoe-cuenta-detalle.read-model';
import {
  CambiarEstadoCuentaPppoeInput,
  ConsultarCredencialesPppoeInstalacionInput,
  ConsultarCredencialesPppoeInstalacionResult,
  CrearCuentaPppoeInput,
  ObtenerDetalleCuentaPppoeInput,
  PppoeClienteCuentaFacadePort,
  RegistrarCuentaPppoeAdoptadaInput,
  RegistrarErrorCuentaPppoeInput,
} from '../../public/pppoe-cliente-cuenta.facade.port';
import { BuscarCuentaPppoeUseCase } from '../use-cases/buscar-cuenta-pppoe.use-case';
import { CambiarEstadoCuentaPppoeUseCase } from '../use-cases/cambiar-estado-cuenta-pppoe.use-case';
import { ConsultarCredencialesPppoeInstalacionUseCase } from '../use-cases/consultar-credenciales-pppoe-instalacion.use-case';
import { CrearCuentaPppoeUseCase } from '../use-cases/crear-cuenta-pppoe.use-case';
import { RegistrarCuentaPppoeAdoptadaUseCase } from '../use-cases/registrar-cuenta-pppoe-adoptada.use-case';
import { ObtenerDetalleCuentaPppoeUseCase } from '../use-cases/obtener-detalle-cuenta-pppoe.use-case';
import { RegistrarErrorCuentaPppoeUseCase } from '../use-cases/registrar-error-cuenta-pppoe.use-case';

@Injectable()
export class PppoeClienteCuentaFacade implements PppoeClienteCuentaFacadePort {
  constructor(
    private readonly buscar: BuscarCuentaPppoeUseCase,
    private readonly crearCuenta: CrearCuentaPppoeUseCase,
    private readonly cambiarEstadoCuenta: CambiarEstadoCuentaPppoeUseCase,
    private readonly registrarErrorCuenta: RegistrarErrorCuentaPppoeUseCase,
    private readonly obtenerDetalleCuenta: ObtenerDetalleCuentaPppoeUseCase,
    private readonly credencialesInstalacion: ConsultarCredencialesPppoeInstalacionUseCase,
    private readonly registrarCuentaAdoptada: RegistrarCuentaPppoeAdoptadaUseCase,
  ) {}

  registrarAdoptada(
    input: RegistrarCuentaPppoeAdoptadaInput,
  ): Promise<ClientePppoeCuentaReadModel> {
    return this.registrarCuentaAdoptada.execute(input);
  }

  buscarPorId(
    cuentaPppoeId: number,
  ): Promise<ClientePppoeCuentaReadModel | null> {
    return this.buscar.execute({ por: 'ID', cuentaPppoeId });
  }

  buscarPorAccesoInternet(
    accesoInternetId: number,
  ): Promise<ClientePppoeCuentaReadModel | null> {
    return this.buscar.execute({ por: 'ACCESO_INTERNET', accesoInternetId });
  }

  buscarVigentePorUsuario(
    usuario: string,
  ): Promise<ClientePppoeCuentaReadModel | null> {
    return this.buscar.execute({ por: 'USUARIO_VIGENTE', usuario });
  }

  crear(input: CrearCuentaPppoeInput): Promise<ClientePppoeCuentaReadModel> {
    return this.crearCuenta.execute(input);
  }

  cambiarEstado(
    input: CambiarEstadoCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaReadModel> {
    return this.cambiarEstadoCuenta.execute(input);
  }

  registrarError(
    input: RegistrarErrorCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaReadModel> {
    return this.registrarErrorCuenta.execute(input);
  }

  obtenerDetalle(
    input: ObtenerDetalleCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaDetalleResult> {
    return this.obtenerDetalleCuenta.execute(input);
  }

  consultarCredencialesInstalacion(
    input: ConsultarCredencialesPppoeInstalacionInput,
  ): Promise<ConsultarCredencialesPppoeInstalacionResult> {
    return this.credencialesInstalacion.execute(input);
  }
}
