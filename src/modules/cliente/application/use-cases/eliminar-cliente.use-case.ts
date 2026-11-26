import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import {
  PPPOE_ACCESO_INTERNET,
  PppoeAccesoInternetFacadePort,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { TipoCambioCliente } from '../../domain/enums/tipo-cambio-cliente.enum';
import {
  ClienteConAccesoVigenteError,
  ClienteNoEncontradoError,
} from '../../domain/errors/cliente.errors';
import {
  CLIENTE_REPOSITORY,
  ClienteRepositoryPort,
} from '../../domain/ports/cliente-repository.port';

export type EliminarClienteInput = {
  clienteId: number;
  usuarioId: number;
  empresaId: number;
  motivo?: string | null;
  comentario?: string | null;
};

export type EliminarClienteResult = {
  clienteId: number;
  eliminadoEn: Date;
};

/**
 * Borrado lógico: el cliente sale de las listas y de la facturación, y sus
 * facturas, pagos e historial se conservan. No se permite si todavía tiene
 * servicio en el router, porque seguiría navegando sin facturarse.
 */
@Injectable()
export class EliminarClienteUseCase {
  private readonly logger = new Logger(EliminarClienteUseCase.name);

  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepositoryPort,
    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesos: PppoeAccesoInternetFacadePort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: EliminarClienteInput): Promise<EliminarClienteResult> {
    const resultado = await this.unidad.ejecutar(async () => {
      const cliente = await this.clientes.findById(input.clienteId);
      if (!cliente) throw new ClienteNoEncontradoError();

      const acceso = await this.accesos.buscarPppoeVigenteDelCliente(
        input.clienteId,
      );
      // PENDIENTE aún no existe en el router.
      if (acceso && acceso.estado !== EstadoAccesoInternet.PENDIENTE) {
        throw new ClienteConAccesoVigenteError();
      }

      const fecha = this.reloj.ahora();
      cliente.eliminar({
        actorId: input.usuarioId,
        motivo: input.motivo,
        comentario: input.comentario,
        fecha,
      });

      await this.clientes.update(cliente);
      await this.clientes.registrarCambio({
        empresaId: cliente.empresaId ?? input.empresaId,
        clienteId: input.clienteId,
        tipoCambio: TipoCambioCliente.SOFT_DELETE,
        estadoAnterior: cliente.estadoCliente,
        estadoNuevo: cliente.estadoCliente,
        eliminado: { anterior: false, nuevo: true },
        motivo: input.motivo?.trim() || null,
        descripcion: input.comentario?.trim() || null,
        cambiadoPorId: input.usuarioId,
      });

      return { clienteId: input.clienteId, eliminadoEn: fecha };
    });

    this.logger.log(
      `Cliente ${input.clienteId} eliminado (borrado lógico) por ${input.usuarioId}.`,
    );

    return resultado;
  }
}
