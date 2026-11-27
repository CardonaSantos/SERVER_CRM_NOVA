import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { FacturaNoEncontradaError } from '../../domain/errors/facturacion.errors';
import {
  FACTURA_REPOSITORY,
  FacturaRepositoryPort,
} from '../../domain/ports/factura-repository.port';
import {
  EditarFacturaProps,
  FacturaProps,
} from '../../domain/props/factura.props';
import {
  FACTURACION_EVENTOS,
  FacturacionEventosPort,
} from '../ports/facturacion-eventos.port';
import { CobranzaDelClienteService } from '../services/cobranza-del-cliente.service';

export type EditarFacturaInput = {
  facturaId: number;
  usuarioId: number;
  cambios: EditarFacturaProps;
  /** `true` anula; `false` reactiva; sin valor no cambia. */
  anulada?: boolean;
};

@Injectable()
export class EditarFacturaUseCase {
  private readonly logger = new Logger(EditarFacturaUseCase.name);

  constructor(
    @Inject(FACTURA_REPOSITORY)
    private readonly facturas: FacturaRepositoryPort,
    @Inject(FACTURACION_EVENTOS)
    private readonly eventos: FacturacionEventosPort,
    private readonly cobranza: CobranzaDelClienteService,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: EditarFacturaInput): Promise<FacturaProps> {
    const guardada = await this.unidad.ejecutar(async () => {
      const previa = await this.facturas.findById(input.facturaId);
      if (!previa) throw new FacturaNoEncontradaError();
      await this.cobranza.bloquear(previa.clienteId);

      const factura = await this.facturas.findById(input.facturaId);
      if (!factura) throw new FacturaNoEncontradaError();

      const ahora = this.reloj.ahora();
      if (input.anulada === false) factura.reactivar(ahora);
      if (Object.values(input.cambios).some((valor) => valor !== undefined)) {
        factura.editar(input.cambios, ahora);
      }
      if (input.anulada === true) factura.anular(ahora);

      await this.facturas.update(factura);
      await this.cobranza.recalcular(factura.clienteId);

      return factura.toPrimitives();
    });

    this.logger.log(
      `Factura ${input.facturaId} editada por el usuario ${input.usuarioId}.`,
    );
    await this.eventos.facturacionCambiada(guardada.empresaId);

    return guardada;
  }
}
