import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { EstadoCobranzaCliente } from '../../../cliente-cobranza/public/cliente-cobranza.facade.port';
import { FacturaNoEncontradaError } from '../../domain/errors/facturacion.errors';
import {
  FACTURA_REPOSITORY,
  FacturaRepositoryPort,
} from '../../domain/ports/factura-repository.port';
import {
  FACTURACION_EVENTOS,
  FacturacionEventosPort,
} from '../ports/facturacion-eventos.port';
import { CobranzaDelClienteService } from '../services/cobranza-del-cliente.service';

export type EliminarFacturaInput = {
  facturaId: number;
  usuarioId: number;
  motivo: string;
};

export type EliminarFacturaResult = {
  facturaId: number;
  clienteId: number;
  estadoCobranza: EstadoCobranzaCliente;
};

/** Elimina una factura sin pagos y deja su copia en la bitácora. */
@Injectable()
export class EliminarFacturaUseCase {
  private readonly logger = new Logger(EliminarFacturaUseCase.name);

  constructor(
    @Inject(FACTURA_REPOSITORY)
    private readonly facturas: FacturaRepositoryPort,
    @Inject(FACTURACION_EVENTOS)
    private readonly eventos: FacturacionEventosPort,
    private readonly cobranza: CobranzaDelClienteService,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: EliminarFacturaInput): Promise<EliminarFacturaResult> {
    const { resultado, empresaId } = await this.unidad.ejecutar(async () => {
      const previa = await this.facturas.findById(input.facturaId);
      if (!previa) throw new FacturaNoEncontradaError();
      await this.cobranza.bloquear(previa.clienteId);

      const factura = await this.facturas.findById(input.facturaId);
      if (!factura) throw new FacturaNoEncontradaError();
      factura.asegurarEliminable();

      await this.facturas.registrarEliminacion({
        factura,
        usuarioId: input.usuarioId,
        motivo: input.motivo,
        fecha: this.reloj.ahora(),
      });
      await this.facturas.eliminar(input.facturaId);

      return {
        empresaId: factura.empresaId,
        resultado: {
          facturaId: input.facturaId,
          clienteId: factura.clienteId,
          estadoCobranza: await this.cobranza.recalcular(factura.clienteId),
        },
      };
    });

    this.logger.log(
      `Factura ${input.facturaId} eliminada por el usuario ${input.usuarioId}.`,
    );
    await this.eventos.facturacionCambiada(empresaId);

    return resultado;
  }
}
