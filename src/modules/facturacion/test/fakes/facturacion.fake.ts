import { ClienteCobranzaFacadePort } from '../../../cliente-cobranza/public/cliente-cobranza.facade.port';
import { EstadoCobranzaCliente } from '../../../cliente/public/cliente.types';
import { FacturacionEventosPort } from '../../application/ports/facturacion-eventos.port';
import { RutaCobradoPort } from '../../application/ports/ruta-cobrado.port';
import { FacturaEntity } from '../../domain/entities/factura.entity';
import { PagoEntity } from '../../domain/entities/pago.entity';
import {
  ESTADOS_CON_DEUDA,
  EstadoFactura,
} from '../../domain/enums/estado-factura.enum';
import { MetodoPago } from '../../domain/enums/metodo-pago.enum';
import { OrigenPago } from '../../domain/enums/origen-pago.enum';
import { claveNumeroBoleta } from '../../domain/policies/numero-boleta.policy';
import { ClienteFacturableQueryPort } from '../../domain/ports/cliente-facturable-query.port';
import {
  EliminacionFactura,
  FacturaRepositoryPort,
} from '../../domain/ports/factura-repository.port';
import {
  EliminacionPago,
  PagoRepositoryPort,
} from '../../domain/ports/pago-repository.port';
import { FacturaProps } from '../../domain/props/factura.props';
import { PagoProps } from '../../domain/props/pago.props';
import {
  ClienteFacturable,
  PlanPrimeraFactura,
} from '../../domain/read-models/cliente-facturable.read-model';

const FECHA = new Date('2026-11-01T06:00:00.000Z');

/**
 * Facturas y pagos en memoria. Cada lectura devuelve una copia nueva, como la
 * base de datos.
 */
export class BaseFacturacionFake {
  readonly facturas = new Map<number, FacturaProps>();
  readonly pagos = new Map<number, PagoProps>();
  readonly facturasEliminadas: EliminacionFactura[] = [];
  readonly pagosEliminados: EliminacionPago[] = [];
  private siguienteId = 100;

  sembrarFactura(cambios: Partial<FacturaProps> = {}): number {
    const id = cambios.id ?? this.siguienteId++;
    this.facturas.set(id, {
      empresaId: 1,
      clienteId: 7,
      facturacionZonaId: 2,
      periodo: '202611',
      montoPago: 200,
      saldoPendiente: 200,
      estado: EstadoFactura.PENDIENTE,
      fechaPagoEsperada: FECHA,
      fechaPagada: null,
      detalleFactura: 'Factura',
      nombreClienteFactura: 'Ana',
      creadorId: null,
      creadoEn: FECHA,
      actualizadoEn: FECHA,
      ...cambios,
      id,
    });

    return id;
  }

  sembrarPago(cambios: Partial<PagoProps> & { facturaId: number }): number {
    const id = cambios.id ?? this.siguienteId++;
    this.pagos.set(id, {
      clienteId: 7,
      montoPagado: 50,
      metodoPago: MetodoPago.EFECTIVO,
      fechaPago: FECHA,
      creadoEn: FECHA,
      cobradorId: 4,
      numeroBoleta: null,
      codigoConfirmacion: null,
      origen: OrigenPago.OFICINA,
      rutaId: null,
      ...cambios,
      id,
    });

    return id;
  }

  readonly repositorioFacturas: FacturaRepositoryPort = {
    findById: (id) => {
      const fila = this.facturas.get(id);
      if (!fila) return Promise.resolve(null);
      const pagos = [...this.pagos.values()]
        .filter((pago) => pago.facturaId === id)
        .map((pago) => ({
          id: pago.id,
          monto: pago.montoPagado,
          fecha: pago.fechaPago,
        }));

      return Promise.resolve(FacturaEntity.hydrate({ ...fila }, pagos));
    },
    create: (entity) => {
      const id = this.sembrarFactura({
        ...entity.toPrimitives(),
        id: this.siguienteId++,
      });

      return Promise.resolve(
        FacturaEntity.hydrate({ ...this.facturas.get(id)! }, []),
      );
    },
    update: (entity) => {
      this.facturas.set(entity.id!, entity.toPrimitives());
      return Promise.resolve();
    },
    eliminar: (id) => {
      this.facturas.delete(id);
      return Promise.resolve();
    },
    registrarEliminacion: (eliminacion) => {
      this.facturasEliminadas.push(eliminacion);
      return Promise.resolve();
    },
    periodosEmitidos: (clienteId, periodos) =>
      Promise.resolve(
        [...this.facturas.values()]
          .filter(
            (f) => f.clienteId === clienteId && periodos.includes(f.periodo),
          )
          .map((f) => f.periodo),
      ),
    contarPendientes: (clienteId) =>
      Promise.resolve(
        [...this.facturas.values()].filter(
          (f) =>
            f.clienteId === clienteId && ESTADOS_CON_DEUDA.includes(f.estado),
        ).length,
      ),
  };

  readonly repositorioPagos: PagoRepositoryPort = {
    findById: (id) => {
      const fila = this.pagos.get(id);
      return Promise.resolve(fila ? PagoEntity.hydrate({ ...fila }) : null);
    },
    create: (entity) => {
      const id = this.siguienteId++;
      this.pagos.set(id, { ...entity.toPrimitives(), id });
      return Promise.resolve(PagoEntity.hydrate({ ...this.pagos.get(id)! }));
    },
    existeNumeroBoleta: (clave) =>
      Promise.resolve(
        [...this.pagos.values()].some(
          (p) =>
            p.numeroBoleta !== null &&
            claveNumeroBoleta(p.numeroBoleta) === clave,
        ),
      ),
    eliminar: (id) => {
      this.pagos.delete(id);
      return Promise.resolve();
    },
    registrarEliminacion: (eliminacion) => {
      this.pagosEliminados.push(eliminacion);
      return Promise.resolve();
    },
  };
}

export class CobranzaFake implements ClienteCobranzaFacadePort {
  readonly bloqueados: number[] = [];
  readonly actualizaciones: {
    clienteId: number;
    facturasPendientes: number;
  }[] = [];

  bloquear(clienteId: number): Promise<void> {
    this.bloqueados.push(clienteId);
    return Promise.resolve();
  }

  actualizar(input: {
    clienteId: number;
    facturasPendientes: number;
  }): Promise<EstadoCobranzaCliente> {
    this.actualizaciones.push(input);
    return Promise.resolve(
      input.facturasPendientes > 0
        ? EstadoCobranzaCliente.PAGO_PENDIENTE
        : EstadoCobranzaCliente.AL_DIA,
    );
  }
}

export class RutaCobradoFake implements RutaCobradoPort {
  readonly cobrado = new Map<number, number>([[3, 0]]);

  ajustar(rutaId: number, monto: number): Promise<boolean> {
    const actual = this.cobrado.get(rutaId);
    if (actual === undefined) return Promise.resolve(false);
    this.cobrado.set(rutaId, actual + monto);
    return Promise.resolve(true);
  }
}

export class FacturacionEventosFake implements FacturacionEventosPort {
  readonly empresas: number[] = [];

  facturacionCambiada(empresaId: number): Promise<void> {
    this.empresas.push(empresaId);
    return Promise.resolve();
  }
}

export const CLIENTE_ACTIVO: ClienteFacturable = {
  clienteId: 7,
  empresaId: 1,
  nombre: 'Ana',
  apellidos: 'Pérez',
  estadoCliente: 'ACTIVO',
  isEliminado: false,
  desinstaladoEn: null,
  zona: { id: 2, diaPago: 31 },
  plan: { nombre: 'Plan 10', precio: 150 },
};

export class ClienteFacturableFake implements ClienteFacturableQueryPort {
  cliente: ClienteFacturable | null = CLIENTE_ACTIVO;
  plan: PlanPrimeraFactura | null = {
    diaPago: 10,
    nombre: 'Plan 10',
    velocidad: '10 Mbps',
    precio: 150,
  };

  findById(): Promise<ClienteFacturable | null> {
    return Promise.resolve(this.cliente);
  }

  findPlanPrimeraFactura(): Promise<PlanPrimeraFactura | null> {
    return Promise.resolve(this.plan);
  }
}
