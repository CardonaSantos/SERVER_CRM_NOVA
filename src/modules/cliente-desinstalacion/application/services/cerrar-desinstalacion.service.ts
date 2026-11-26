import { Inject, Injectable } from '@nestjs/common';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import {
  CLIENTE,
  ClienteFacadePort,
} from 'src/modules/cliente/public/cliente.facade.port';
import {
  PPPOE_ACCESO_INTERNET,
  PppoeAccesoInternetFacadePort,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entity';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';

/**
 * Guarda una desinstalación recién completada y, en la misma transacción, deja
 * al cliente DESINSTALADO (sin importar el tipo de desinstalación: todas dan de
 * baja su PPPoE). Si conserva otro acceso vigente, el cliente no cambia.
 */
@Injectable()
export class CerrarDesinstalacionService {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,
    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesos: PppoeAccesoInternetFacadePort,
    @Inject(CLIENTE)
    private readonly clientes: ClienteFacadePort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
  ) {}

  guardarCompletada(
    desinstalacion: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity> {
    return this.unidad.ejecutar(async () => {
      const guardada = await this.desinstalaciones.save(desinstalacion);
      const props = guardada.toPrimitives();

      const vigente = await this.accesos.buscarPppoeVigenteDelCliente(
        props.clienteId,
      );
      if (vigente && vigente.id !== props.accesoInternetId) return guardada;

      await this.clientes.marcarDesinstalado({
        empresaId: props.empresaId,
        clienteId: props.clienteId,
        fecha: props.fechaFinalizacion!,
        cambiadoPorId: props.ejecutadoPorId,
        motivo: props.motivo ?? null,
        descripcion: `Desinstalación ${props.id} (${props.tipo}) completada.`,
      });

      return guardada;
    });
  }
}
