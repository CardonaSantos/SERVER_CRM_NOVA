import { Injectable } from '@nestjs/common';

import { BuscarPerfilPorRouterServicioParams } from '../../domain/ports/perfil-homologacion-repository.port';
import { PerfilHomologacionReadModel } from '../../domain/read-models/perfil-homologacion.read-model';
import { PppoePerfilHomologacionFacadePort } from '../../public/pppoe-perfil-homologacion.facade.port';
import { BuscarPerfilHomologacionUseCase } from '../use-cases/buscar-perfil-homologacion.use-case';

@Injectable()
export class PppoePerfilHomologacionFacade
  implements PppoePerfilHomologacionFacadePort
{
  constructor(private readonly buscar: BuscarPerfilHomologacionUseCase) {}

  buscarPorId(id: number): Promise<PerfilHomologacionReadModel | null> {
    return this.buscar.execute({ por: 'ID', id });
  }

  buscarActivoPorRouterYServicio(
    params: BuscarPerfilPorRouterServicioParams,
  ): Promise<PerfilHomologacionReadModel | null> {
    return this.buscar.execute({ por: 'ACTIVO_ROUTER_SERVICIO', ...params });
  }
}
