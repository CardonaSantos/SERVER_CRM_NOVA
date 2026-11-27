import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { EstadoCobranzaCliente } from '../../../cliente-cobranza/public/cliente-cobranza.facade.port';
import { PagoEntity } from '../../domain/entities/pago.entity';
import { EstadoFactura } from '../../domain/enums/estado-factura.enum';
import {
  FacturaDeOtroClienteError,
  FacturaNoEncontradaError,
  FacturacionRutaNoEncontradaError,
  PagoBoletaDuplicadaError,
} from '../../domain/errors/facturacion.errors';
import { claveNumeroBoleta } from '../../domain/policies/numero-boleta.policy';
import {
  FACTURA_REPOSITORY,
  FacturaRepositoryPort,
} from '../../domain/ports/factura-repository.port';
import {
  PAGO_REPOSITORY,
  PagoRepositoryPort,
} from '../../domain/ports/pago-repository.port';
import { RegistrarPagoProps } from '../../domain/props/pago.props';
import {
  FACTURACION_EVENTOS,
  FacturacionEventosPort,
} from '../ports/facturacion-eventos.port';
import { RUTA_COBRADO, RutaCobradoPort } from '../ports/ruta-cobrado.port';
import { CobranzaDelClienteService } from './cobranza-del-cliente.service';

export type PagoRegistrado = {
  pagoId: number;
  facturaId: number;
  estadoFactura: EstadoFactura;
  saldoPendiente: number;
  estadoCobranza: EstadoCobranzaCliente;
};

/** El pago, la factura, la cobranza y lo cobrado de la ruta: todo o nada. */
@Injectable()
export class RegistradorPagosService {
  private readonly logger = new Logger(RegistradorPagosService.name);

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

  async registrar(input: RegistrarPagoProps): Promise<PagoRegistrado> {
    const { resultado, empresaId } = await this.unidad.ejecutar(async () => {
      await this.cobranza.bloquear(input.clienteId);

      const factura = await this.facturas.findById(input.facturaId);
      if (!factura) throw new FacturaNoEncontradaError();
      if (factura.clienteId !== input.clienteId) {
        throw new FacturaDeOtroClienteError();
      }

      const ahora = this.reloj.ahora();
      const pago = PagoEntity.registrar(input, ahora);
      factura.registrarPago(pago.montoPagado, pago.fechaPago, ahora);

      if (
        pago.numeroBoleta &&
        (await this.pagos.existeNumeroBoleta(
          claveNumeroBoleta(pago.numeroBoleta),
        ))
      ) {
        throw new PagoBoletaDuplicadaError();
      }

      const guardado = await this.pagos.create(pago);
      await this.facturas.update(factura);

      if (
        pago.rutaId !== null &&
        !(await this.rutas.ajustar(pago.rutaId, pago.montoPagado))
      ) {
        throw new FacturacionRutaNoEncontradaError();
      }

      return {
        empresaId: factura.empresaId,
        resultado: {
          pagoId: guardado.id!,
          facturaId: input.facturaId,
          estadoFactura: factura.estado,
          saldoPendiente: factura.saldoPendiente,
          estadoCobranza: await this.cobranza.recalcular(input.clienteId),
        },
      };
    });

    this.logger.log(
      `Pago ${resultado.pagoId} de la factura ${resultado.facturaId} registrado por el usuario ${input.cobradorId}.`,
    );
    await this.eventos.facturacionCambiada(empresaId);

    return resultado;
  }
}
