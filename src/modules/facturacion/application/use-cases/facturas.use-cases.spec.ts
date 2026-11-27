import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { EstadoFactura } from '../../domain/enums/estado-factura.enum';
import {
  ClienteNoFacturableError,
  FacturaConPagosError,
  FacturaDuplicadaError,
  FacturaNoEncontradaError,
  FacturacionClienteNoEncontradoError,
  FacturacionReferenciaInvalidaError,
} from '../../domain/errors/facturacion.errors';
import {
  BaseFacturacionFake,
  CLIENTE_ACTIVO,
  ClienteFacturableFake,
  CobranzaFake,
  FacturacionEventosFake,
} from '../../test/fakes/facturacion.fake';
import { CobranzaDelClienteService } from '../services/cobranza-del-cliente.service';
import { EmisorFacturasService } from '../services/emisor-facturas.service';
import { EditarFacturaUseCase } from './editar-factura.use-case';
import { EliminarFacturaUseCase } from './eliminar-factura.use-case';
import { GenerarFacturaUseCase } from './generar-factura.use-case';
import { GenerarFacturasUseCase } from './generar-facturas.use-case';
import { GenerarPrimeraFacturaUseCase } from './generar-primera-factura.use-case';

const AHORA = new Date('2026-11-26T18:00:00.000Z');

describe('facturas', () => {
  let base: BaseFacturacionFake;
  let clientes: ClienteFacturableFake;
  let cobranza: CobranzaFake;
  let eventos: FacturacionEventosFake;
  let unidad: UnidadDeTrabajoEnMemoria;
  const reloj = new RelojFijo(AHORA);

  beforeEach(() => {
    base = new BaseFacturacionFake();
    clientes = new ClienteFacturableFake();
    cobranza = new CobranzaFake();
    eventos = new FacturacionEventosFake();
    unidad = new UnidadDeTrabajoEnMemoria();
  });

  const servicio = () =>
    new CobranzaDelClienteService(cobranza, base.repositorioFacturas);
  const emisor = () =>
    new EmisorFacturasService(
      clientes,
      base.repositorioFacturas,
      eventos,
      servicio(),
      unidad,
      reloj,
    );

  describe('generar', () => {
    const varias = () =>
      new GenerarFacturasUseCase(emisor()).execute({
        usuarioId: 4,
        clienteId: 7,
        anio: 2027,
        mesInicio: 1,
        mesFin: 3,
      });

    it('emite una por mes con el precio del plan y el usuario como creador', async () => {
      const facturas = await varias();

      expect(facturas.map((f) => f.periodo)).toEqual([
        '202701',
        '202702',
        '202703',
      ]);
      expect(facturas[1]).toMatchObject({
        montoPago: 150,
        saldoPendiente: 150,
        creadorId: 4,
        facturacionZonaId: 2,
        fechaPagoEsperada: new Date('2027-02-28T06:00:00.000Z'),
        nombreClienteFactura: 'Ana Pérez',
      });
      expect(cobranza.actualizaciones).toEqual([
        { clienteId: 7, facturasPendientes: 3 },
      ]);
      expect(eventos.empresas).toEqual([1]);
    });

    it('si un mes ya existe, en cualquier zona, no emite ninguna', async () => {
      base.sembrarFactura({ periodo: '202702', facturacionZonaId: 99 });

      await expect(varias()).rejects.toThrow(FacturaDuplicadaError);
      expect(base.facturas.size).toBe(1);
    });

    it.each([
      { isEliminado: true },
      { desinstaladoEn: AHORA },
      { estadoCliente: 'SUSPENDIDO' },
      { zona: null },
      { plan: null },
    ])('no factura a un cliente con %p', async (cambio) => {
      clientes.cliente = { ...CLIENTE_ACTIVO, ...cambio };

      await expect(
        new GenerarFacturaUseCase(emisor()).execute({
          usuarioId: 4,
          clienteId: 7,
          anio: 2027,
          mes: 1,
        }),
      ).rejects.toThrow(ClienteNoFacturableError);
      expect(base.facturas.size).toBe(0);
    });

    it('un cliente inexistente', async () => {
      clientes.cliente = null;

      await expect(varias()).rejects.toThrow(
        FacturacionClienteNoEncontradoError,
      );
    });
  });

  describe('primera factura', () => {
    const generar = () =>
      new GenerarPrimeraFacturaUseCase(
        clientes,
        base.repositorioFacturas,
        servicio(),
        unidad,
      ).execute({
        clienteId: 7,
        empresaId: 1,
        nombre: 'Ana',
        apellidos: null,
        zonaFacturacionId: 2,
        servicioInternetId: 3,
        ahora: AHORA,
      });

    it('nace pendiente y deja la cobranza del cliente', async () => {
      await expect(generar()).resolves.toEqual({
        estadoCobranza: 'PAGO_PENDIENTE',
      });
      expect([...base.facturas.values()]).toEqual([
        expect.objectContaining({
          periodo: '202611',
          montoPago: 150,
          detalleFactura: 'Pago mensual servicio Plan 10 (10 Mbps)',
        }),
      ]);
      expect(eventos.empresas).toHaveLength(0);
    });

    it('sin zona o plan falla', async () => {
      clientes.plan = null;

      await expect(generar()).rejects.toThrow(
        FacturacionReferenciaInvalidaError,
      );
    });
  });

  describe('editar y eliminar', () => {
    const editar = () =>
      new EditarFacturaUseCase(
        base.repositorioFacturas,
        eventos,
        servicio(),
        unidad,
        reloj,
      );
    const eliminar = () =>
      new EliminarFacturaUseCase(
        base.repositorioFacturas,
        eventos,
        servicio(),
        unidad,
        reloj,
      );

    it('anula y reactiva recalculando la cobranza', async () => {
      const id = base.sembrarFactura();
      const input = { facturaId: id, usuarioId: 4, cambios: {} };

      await editar().execute({ ...input, anulada: true });
      expect(base.facturas.get(id)!.estado).toBe(EstadoFactura.ANULADA);

      await editar().execute({
        ...input,
        anulada: false,
        cambios: { montoPago: 120 },
      });
      expect(base.facturas.get(id)).toMatchObject({
        estado: EstadoFactura.PENDIENTE,
        saldoPendiente: 120,
      });
      expect(cobranza.actualizaciones.map((a) => a.facturasPendientes)).toEqual(
        [0, 1],
      );
    });

    it('elimina una sin pagos y la deja en la bitácora', async () => {
      const id = base.sembrarFactura();

      await eliminar().execute({
        facturaId: id,
        usuarioId: 5,
        motivo: 'error',
      });

      expect(base.facturas.size).toBe(0);
      expect(base.facturasEliminadas).toEqual([
        expect.objectContaining({ usuarioId: 5, motivo: 'error' }),
      ]);
    });

    it('con pagos no se elimina', async () => {
      const id = base.sembrarFactura({ estado: EstadoFactura.PARCIAL });
      base.sembrarPago({ facturaId: id });

      await expect(
        eliminar().execute({ facturaId: id, usuarioId: 5, motivo: 'x' }),
      ).rejects.toThrow(FacturaConPagosError);
      expect(base.facturas.size).toBe(1);
      expect(base.facturasEliminadas).toHaveLength(0);
    });

    it('una factura inexistente', async () => {
      await expect(
        eliminar().execute({ facturaId: 1, usuarioId: 5, motivo: 'x' }),
      ).rejects.toThrow(FacturaNoEncontradaError);
    });
  });
});
