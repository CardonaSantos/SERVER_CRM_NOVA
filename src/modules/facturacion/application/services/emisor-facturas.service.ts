import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { FacturaEntity } from '../../domain/entities/factura.entity';
import {
  FacturaDuplicadaError,
  FacturacionClienteNoEncontradoError,
} from '../../domain/errors/facturacion.errors';
import {
  detalleDelMes,
  fechasDelMes,
  MesFacturado,
} from '../../domain/policies/calendario-factura.policy';
import { asegurarFacturable } from '../../domain/policies/cliente-facturable.policy';
import {
  CLIENTE_FACTURABLE_QUERY,
  ClienteFacturableQueryPort,
} from '../../domain/ports/cliente-facturable-query.port';
import {
  FACTURA_REPOSITORY,
  FacturaRepositoryPort,
} from '../../domain/ports/factura-repository.port';
import { FacturaProps } from '../../domain/props/factura.props';
import {
  FACTURACION_EVENTOS,
  FacturacionEventosPort,
} from '../ports/facturacion-eventos.port';
import { CobranzaDelClienteService } from './cobranza-del-cliente.service';

export type EmitirFacturas = {
  clienteId: number;
  creadorId: number;
  meses: MesFacturado[];
};

/** Facturas generadas a mano: se emiten todas o ninguna. */
@Injectable()
export class EmisorFacturasService {
  constructor(
    @Inject(CLIENTE_FACTURABLE_QUERY)
    private readonly clientes: ClienteFacturableQueryPort,
    @Inject(FACTURA_REPOSITORY)
    private readonly facturas: FacturaRepositoryPort,
    @Inject(FACTURACION_EVENTOS)
    private readonly eventos: FacturacionEventosPort,
    private readonly cobranza: CobranzaDelClienteService,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async emitir(input: EmitirFacturas): Promise<FacturaProps[]> {
    const emitidas = await this.unidad.ejecutar(async () => {
      await this.cobranza.bloquear(input.clienteId);

      const encontrado = await this.clientes.findById(input.clienteId);
      if (!encontrado) throw new FacturacionClienteNoEncontradoError();
      const cliente = asegurarFacturable(encontrado);

      const nuevas = input.meses.map((mes) => ({
        mes,
        ...fechasDelMes(mes, cliente.zona.diaPago),
      }));
      const repetidos = await this.facturas.periodosEmitidos(
        input.clienteId,
        nuevas.map((nueva) => nueva.periodo),
      );
      if (repetidos.length > 0) throw new FacturaDuplicadaError(repetidos);

      const ahora = this.reloj.ahora();
      const guardadas: FacturaProps[] = [];
      for (const { mes, periodo, fechaPagoEsperada } of nuevas) {
        const guardada = await this.facturas.create(
          FacturaEntity.emitir(
            {
              empresaId: cliente.empresaId,
              clienteId: input.clienteId,
              facturacionZonaId: cliente.zona.id,
              periodo,
              fechaPagoEsperada,
              montoPago: cliente.plan.precio,
              detalleFactura: detalleDelMes(mes, cliente.plan),
              nombreClienteFactura:
                `${cliente.nombre} ${cliente.apellidos ?? ''}`.trim(),
              creadorId: input.creadorId,
            },
            ahora,
          ),
        );
        guardadas.push(guardada.toPrimitives());
      }

      await this.cobranza.recalcular(input.clienteId);

      return guardadas;
    });

    await this.eventos.facturacionCambiada(emitidas[0].empresaId);

    return emitidas;
  }
}
