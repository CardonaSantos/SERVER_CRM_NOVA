import { Injectable } from '@nestjs/common';
import {
  EnviarAvisoInput,
  MensajeriaClienteFacadePort,
} from '../../public/mensajeria-cliente.facade.port';
import { normalizarTelefonos } from '../../domain/policies/telefono.policy';
import { EnviarPlantillaUseCase } from '../use-cases/enviar-plantilla.use-case';

@Injectable()
export class MensajeriaClienteFacade implements MensajeriaClienteFacadePort {
  constructor(private readonly enviar: EnviarPlantillaUseCase) {}

  normalizarTelefonos(crudos: Array<string | null | undefined>): string[] {
    return normalizarTelefonos(crudos);
  }

  enviarPlantilla(
    input: EnviarAvisoInput,
  ): Promise<{ mensajeId: string | null }> {
    return this.enviar.execute(input);
  }
}
