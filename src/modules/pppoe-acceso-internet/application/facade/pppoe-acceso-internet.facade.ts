import { Injectable } from '@nestjs/common';

import { AccesoInternetReadModel } from '../../domain/read-models/acceso-internet.read-model';
import {
  CambiarEstadoAccesoInternetInput,
  CrearAccesoInternetInput,
  PppoeAccesoInternetFacadePort,
  RegistrarAccesoInternetAdoptadoInput,
} from '../../public/pppoe-acceso-internet.facade.port';
import { BuscarAccesoInternetUseCase } from '../use-cases/buscar-acceso-internet.use-case';
import { CambiarEstadoAccesoInternetUseCase } from '../use-cases/cambiar-estado-acceso-internet.use-case';
import { CrearAccesoInternetUseCase } from '../use-cases/crear-acceso-internet.use-case';
import { RegistrarAccesoInternetAdoptadoUseCase } from '../use-cases/registrar-acceso-internet-adoptado.use-case';

@Injectable()
export class PppoeAccesoInternetFacade
  implements PppoeAccesoInternetFacadePort
{
  constructor(
    private readonly buscar: BuscarAccesoInternetUseCase,
    private readonly crearAcceso: CrearAccesoInternetUseCase,
    private readonly cambiarEstadoAcceso: CambiarEstadoAccesoInternetUseCase,
    private readonly registrarAccesoAdoptado: RegistrarAccesoInternetAdoptadoUseCase,
  ) {}

  registrarAdoptado(
    input: RegistrarAccesoInternetAdoptadoInput,
  ): Promise<AccesoInternetReadModel> {
    return this.registrarAccesoAdoptado.execute(input);
  }

  buscarPorId(
    accesoInternetId: number,
  ): Promise<AccesoInternetReadModel | null> {
    return this.buscar.execute({ por: 'ID', accesoInternetId });
  }

  buscarDelCliente(params: {
    accesoInternetId: number;
    clienteId: number;
  }): Promise<AccesoInternetReadModel | null> {
    return this.buscar.execute({ por: 'CLIENTE', ...params });
  }

  buscarPppoeVigenteDelCliente(
    clienteId: number,
  ): Promise<AccesoInternetReadModel | null> {
    return this.buscar.execute({ por: 'PPPOE_VIGENTE', clienteId });
  }

  crear(input: CrearAccesoInternetInput): Promise<AccesoInternetReadModel> {
    return this.crearAcceso.execute(input);
  }

  cambiarEstado(
    input: CambiarEstadoAccesoInternetInput,
  ): Promise<AccesoInternetReadModel> {
    return this.cambiarEstadoAcceso.execute(input);
  }
}
