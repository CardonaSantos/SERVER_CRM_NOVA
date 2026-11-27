import { Inject, Injectable } from '@nestjs/common';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { EstadoCobranzaCliente } from '../../../cliente-cobranza/public/cliente-cobranza.facade.port';
import { FacturaEntity } from '../../domain/entities/factura.entity';
import { FacturacionReferenciaInvalidaError } from '../../domain/errors/facturacion.errors';
import {
  detallePrimeraFactura,
  fechasPrimeraFactura,
} from '../../domain/policies/calendario-factura.policy';
import {
  CLIENTE_FACTURABLE_QUERY,
  ClienteFacturableQueryPort,
} from '../../domain/ports/cliente-facturable-query.port';
import {
  FACTURA_REPOSITORY,
  FacturaRepositoryPort,
} from '../../domain/ports/factura-repository.port';
import { CobranzaDelClienteService } from '../services/cobranza-del-cliente.service';

export type GenerarPrimeraFacturaInput = {
  clienteId: number;
  empresaId: number;
  nombre: string;
  apellidos: string | null;
  zonaFacturacionId: number;
  servicioInternetId: number;
  ahora: Date;
};

/** La factura con la que nace un cliente, dentro de su alta. */
@Injectable()
export class GenerarPrimeraFacturaUseCase {
  constructor(
    @Inject(CLIENTE_FACTURABLE_QUERY)
    private readonly clientes: ClienteFacturableQueryPort,
    @Inject(FACTURA_REPOSITORY)
    private readonly facturas: FacturaRepositoryPort,
    private readonly cobranza: CobranzaDelClienteService,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
  ) {}

  execute(
    input: GenerarPrimeraFacturaInput,
  ): Promise<{ estadoCobranza: EstadoCobranzaCliente }> {
    return this.unidad.ejecutar(async () => {
      const plan = await this.clientes.findPlanPrimeraFactura(
        input.zonaFacturacionId,
        input.servicioInternetId,
      );
      if (!plan) throw new FacturacionReferenciaInvalidaError();

      await this.facturas.create(
        FacturaEntity.emitir(
          {
            empresaId: input.empresaId,
            clienteId: input.clienteId,
            facturacionZonaId: input.zonaFacturacionId,
            ...fechasPrimeraFactura(input.ahora, plan.diaPago),
            montoPago: plan.precio,
            detalleFactura: detallePrimeraFactura(plan),
            nombreClienteFactura: `${input.nombre} ${input.apellidos ?? ''}`,
          },
          input.ahora,
        ),
      );

      return {
        estadoCobranza: await this.cobranza.recalcular(input.clienteId),
      };
    });
  }
}
