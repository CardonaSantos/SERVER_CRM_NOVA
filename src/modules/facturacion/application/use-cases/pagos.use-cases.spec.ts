import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { EstadoFactura } from '../../domain/enums/estado-factura.enum';
import { MetodoPago } from '../../domain/enums/metodo-pago.enum';
import { OrigenPago } from '../../domain/enums/origen-pago.enum';
import {
  FacturaDeOtroClienteError,
  FacturaNoEncontradaError,
  FacturaSinDeudaError,
  FacturacionRutaNoEncontradaError,
  PagoBoletaDuplicadaError,
  PagoNoEncontradoError,
} from '../../domain/errors/facturacion.errors';
import {
  BaseFacturacionFake,
  CobranzaFake,
  FacturacionEventosFake,
  RutaCobroFake,
} from '../../test/fakes/facturacion.fake';
import { CobranzaDelClienteService } from '../services/cobranza-del-cliente.service';
import { RegistradorPagosService } from '../services/registrador-pagos.service';
import { EliminarPagoUseCase } from './eliminar-pago.use-case';
import { RegistrarPagoOficinaUseCase } from './registrar-pago-oficina.use-case';
import { RegistrarPagoRutaUseCase } from './registrar-pago-ruta.use-case';

const AHORA = new Date('2026-11-26T18:00:00.000Z');

describe('pagos', () => {
  let base: BaseFacturacionFake;
  let cobranza: CobranzaFake;
  let rutas: RutaCobroFake;
  let eventos: FacturacionEventosFake;
  let unidad: UnidadDeTrabajoEnMemoria;
  const reloj = new RelojFijo(AHORA);

  beforeEach(() => {
    base = new BaseFacturacionFake();
    cobranza = new CobranzaFake();
    rutas = new RutaCobroFake();
    eventos = new FacturacionEventosFake();
    unidad = new UnidadDeTrabajoEnMemoria();
  });

  const servicio = () =>
    new CobranzaDelClienteService(cobranza, base.repositorioFacturas);
  const registrador = () =>
    new RegistradorPagosService(
      base.repositorioFacturas,
      base.repositorioPagos,
      rutas,
      eventos,
      servicio(),
      unidad,
      reloj,
    );
  const enOficina = () => new RegistrarPagoOficinaUseCase(registrador(), reloj);
  const enRuta = () => new RegistrarPagoRutaUseCase(registrador(), reloj);
  const eliminar = () =>
    new EliminarPagoUseCase(
      base.repositorioFacturas,
      base.repositorioPagos,
      eventos,
      servicio(),
      unidad,
      reloj,
    );

  const pago = (facturaId: number) => ({
    usuarioId: 4,
    facturaId,
    clienteId: 7,
    montoPagado: 200,
    metodoPago: MetodoPago.EFECTIVO,
  });

  describe('registrar', () => {
    it('salda la factura, cobra el usuario de la sesión y avisa', async () => {
      const id = base.sembrarFactura();

      const resultado = await enOficina().execute(pago(id));

      expect(resultado).toMatchObject({
        estadoFactura: EstadoFactura.PAGADA,
        saldoPendiente: 0,
      });
      expect(base.pagos.get(resultado.pagoId)).toMatchObject({
        cobradorId: 4,
        origen: OrigenPago.OFICINA,
        fechaPago: AHORA,
        rutaId: null,
      });
      expect(base.facturas.get(id)!.fechaPagada).toEqual(AHORA);
      expect(cobranza.bloqueados).toEqual([7]);
      expect(cobranza.actualizaciones).toEqual([
        { clienteId: 7, facturasPendientes: 0 },
      ]);
      expect(unidad.aperturas).toHaveLength(1);
      expect(eventos.empresas).toEqual([1]);
    });

    it('en ruta comprueba la ruta y la guarda en el pago', async () => {
      const id = base.sembrarFactura();

      const { pagoId } = await enRuta().execute({ ...pago(id), rutaId: 3 });

      expect(rutas.verificados).toEqual([{ rutaId: 3, clienteId: 7 }]);
      expect(base.pagos.get(pagoId)).toMatchObject({
        origen: OrigenPago.RUTA,
        rutaId: 3,
      });
    });

    it('con una ruta inexistente falla', async () => {
      const id = base.sembrarFactura();

      await expect(
        enRuta().execute({ ...pago(id), rutaId: 99 }),
      ).rejects.toThrow(FacturacionRutaNoEncontradaError);
      expect(base.pagos.size).toBe(0);
      expect(eventos.empresas).toHaveLength(0);
    });

    it('si la ruta rechaza el cobro no se guarda nada', async () => {
      const id = base.sembrarFactura();
      rutas.rechazo = new Error('ruta cerrada');

      await expect(
        enRuta().execute({ ...pago(id), rutaId: 3 }),
      ).rejects.toThrow('ruta cerrada');
      expect(base.pagos.size).toBe(0);
      expect(base.facturas.get(id)!.estado).toBe(EstadoFactura.PENDIENTE);
    });

    it('en oficina no consulta ninguna ruta', async () => {
      await enOficina().execute(pago(base.sembrarFactura()));

      expect(rutas.verificados).toHaveLength(0);
    });

    it('cobrar dos veces la misma factura se rechaza', async () => {
      const id = base.sembrarFactura();
      await enOficina().execute(pago(id));

      await expect(enOficina().execute(pago(id))).rejects.toThrow(
        FacturaSinDeudaError,
      );
      expect(base.pagos.size).toBe(1);
    });

    it('rechaza una factura inexistente o de otro cliente', async () => {
      const id = base.sembrarFactura({ clienteId: 8 });

      await expect(enOficina().execute(pago(999))).rejects.toThrow(
        FacturaNoEncontradaError,
      );
      await expect(enOficina().execute(pago(id))).rejects.toThrow(
        FacturaDeOtroClienteError,
      );
      expect(base.pagos.size).toBe(0);
    });

    it('no repite un número de transferencia escrito distinto', async () => {
      const otra = base.sembrarFactura({ periodo: '202610' });
      base.sembrarPago({
        facturaId: otra,
        metodoPago: MetodoPago.DEPOSITO,
        numeroBoleta: 'TR 001',
      });
      const id = base.sembrarFactura();

      await expect(
        enOficina().execute({
          ...pago(id),
          metodoPago: MetodoPago.DEPOSITO,
          numeroBoleta: 'tr001',
        }),
      ).rejects.toThrow(PagoBoletaDuplicadaError);
      expect(base.facturas.get(id)!.estado).toBe(EstadoFactura.PENDIENTE);
    });
  });

  describe('eliminar', () => {
    it('guarda la copia, libera el número y devuelve la deuda', async () => {
      const id = base.sembrarFactura();
      const { pagoId } = await enRuta().execute({
        ...pago(id),
        rutaId: 3,
        metodoPago: MetodoPago.DEPOSITO,
        numeroBoleta: 'TR-9',
      });

      const resultado = await eliminar().execute({
        pagoId,
        usuarioId: 5,
        motivo: 'monto equivocado',
      });

      expect(resultado).toMatchObject({
        estadoFactura: EstadoFactura.PENDIENTE,
        saldoPendiente: 200,
      });
      expect(base.pagos.size).toBe(0);
      expect(base.pagosEliminados).toEqual([
        expect.objectContaining({
          usuarioId: 5,
          motivo: 'monto equivocado',
          fecha: AHORA,
        }),
      ]);
      expect(base.pagosEliminados[0].pago.numeroBoleta).toBe('TR-9');

      await expect(
        enOficina().execute({
          ...pago(id),
          metodoPago: MetodoPago.DEPOSITO,
          numeroBoleta: 'TR-9',
        }),
      ).resolves.toBeDefined();
    });

    it('un pago inexistente', async () => {
      await expect(
        eliminar().execute({ pagoId: 1, usuarioId: 5, motivo: 'x' }),
      ).rejects.toThrow(PagoNoEncontradoError);
    });
  });
});
