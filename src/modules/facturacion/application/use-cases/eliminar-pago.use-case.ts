import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { EstadoCobranzaCliente } from '../../../cliente-cobranza/public/cliente-cobranza.facade.port';
import { EstadoFactura } from '../../domain/enums/estado-factura.enum';
import {
  FacturaNoEncontradaError,
  PagoNoEncontradoError,
} from '../../domain/errors/facturacion.errors';
import {
  FACTURA_REPOSITORY,
  FacturaRepositoryPort,
} from '../../domain/ports/factura-repository.port';
import {
  PAGO_REPOSITORY,
  PagoRepositoryPort,
} from '../../domain/ports/pago-repository.port';
import {
  FACTURACION_EVENTOS,
  FacturacionEventosPort,
} from '../ports/facturacion-eventos.port';
import { RUTA_COBRADO, RutaCobradoPort } from '../ports/ruta-cobrado.port';
import { CobranzaDelClienteService } from '../services/cobranza-del-cliente.service';

export type EliminarPagoInput = {
  pagoId: number;
  usuarioId: number;
  motivo: string;
};

export type EliminarPagoResult = {
  pagoId: number;
  facturaId: number;
  estadoFactura: EstadoFactura;
  saldoPendiente: number;
  estadoCobranza: EstadoCobranzaCliente;
};

/**
 * Elimina un pago dejando su copia (quién, cuándo y por qué), libera su número
 * de boleta o transferencia y devuelve la deuda a la factura.
 */
@Injectable()
export class EliminarPagoUseCase {
  private readonly logger = new Logger(EliminarPagoUseCase.name);

  constructor(
    @Inject(FACTURA_REPOSITORY)
    private readonly facturas: FacturaRepositoryPort,
    @Inject(PAGO_REPOSITORY) private readonly pagos: PagoRepositoryPort,
    @Inject(RUTA_COBRADO) private readonly rutas: RutaCobradoPort,
    @Inject(FACTURACION_EVENTOS)
    private readonly eventos: FacturacionEventosPort,
    private readonly cobranza: CobranzaDelClienteService,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: EliminarPagoInput): Promise<EliminarPagoResult> {
    const { resultado, empresaId } = await this.unidad.ejecutar(async () => {
      const previo = await this.pagos.findById(input.pagoId);
      if (!previo) throw new PagoNoEncontradoError();
      await this.cobranza.bloquear(previo.clienteId);

      // Otra petición pudo eliminarlo mientras se esperaba al cliente.
      const pago = await this.pagos.findById(input.pagoId);
      if (!pago) throw new PagoNoEncontradoError();
      const factura = await this.facturas.findById(pago.facturaId);
      if (!factura) throw new FacturaNoEncontradaError();

      const ahora = this.reloj.ahora();
      factura.quitarPago(input.pagoId, ahora);

      await this.pagos.registrarEliminacion({
        pago,
        usuarioId: input.usuarioId,
        motivo: input.motivo,
        fecha: ahora,
      });
      await this.pagos.eliminar(input.pagoId);
      await this.facturas.update(factura);
      if (pago.rutaId !== null) {
        await this.rutas.ajustar(pago.rutaId, -pago.montoPagado);
      }

      return {
        empresaId: factura.empresaId,
        resultado: {
          pagoId: input.pagoId,
          facturaId: pago.facturaId,
          estadoFactura: factura.estado,
          saldoPendiente: factura.saldoPendiente,
          estadoCobranza: await this.cobranza.recalcular(factura.clienteId),
        },
      };
    });

    this.logger.log(
      `Pago ${input.pagoId} eliminado por el usuario ${input.usuarioId}.`,
    );
    await this.eventos.facturacionCambiada(empresaId);

    return resultado;
  }
}
