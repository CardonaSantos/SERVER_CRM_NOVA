import { Inject, Injectable } from '@nestjs/common';

import { ClienteAccesoInternetEntity } from '../../domain/entities/cliente-acceso-internet.entity';
import {
  CLIENTE_ACCESO_INTERNET_REPOSITORY,
  ClienteAccesoInternetRepositoryPort,
} from '../../domain/ports/cliente-acceso-internet-repository.port';
import {
  AccesoInternetReadModel,
  aAccesoInternetReadModel,
} from '../../domain/read-models/acceso-internet.read-model';

export type BuscarAccesoInternetInput =
  | { por: 'ID'; accesoInternetId: number }
  | { por: 'CLIENTE'; accesoInternetId: number; clienteId: number }
  | { por: 'PPPOE_VIGENTE'; clienteId: number };

@Injectable()
export class BuscarAccesoInternetUseCase {
  constructor(
    @Inject(CLIENTE_ACCESO_INTERNET_REPOSITORY)
    private readonly accesos: ClienteAccesoInternetRepositoryPort,
  ) {}

  async execute(
    input: BuscarAccesoInternetInput,
  ): Promise<AccesoInternetReadModel | null> {
    const acceso = await this.buscar(input);
    return acceso ? aAccesoInternetReadModel(acceso) : null;
  }

  private buscar(
    input: BuscarAccesoInternetInput,
  ): Promise<ClienteAccesoInternetEntity | null> {
    switch (input.por) {
      case 'ID':
        return this.accesos.findById(input.accesoInternetId);
      case 'CLIENTE':
        return this.accesos.findByIdForClient({
          accesoInternetId: input.accesoInternetId,
          clienteId: input.clienteId,
        });
      case 'PPPOE_VIGENTE':
        return this.accesos.findPppoeVigenteByClienteId(input.clienteId);
      default: {
        const exhaustivo: never = input;
        throw new Error(`Búsqueda no soportada: ${JSON.stringify(exhaustivo)}`);
      }
    }
  }
}
