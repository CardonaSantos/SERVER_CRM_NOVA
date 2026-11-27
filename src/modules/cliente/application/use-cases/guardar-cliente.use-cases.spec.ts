import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { ZonaFacturacionFacadePort } from '../../../zona-facturacion/public/zona-facturacion.facade.port';
import { EstadoCobranzaCliente } from '../../domain/enums/estado-cobranza-cliente.enum';
import { EstadoOperativoCliente } from '../../domain/enums/estado-operativo-cliente.enum';
import { EstadoServicioMikrotik } from '../../domain/enums/estado-servicio-mikrotik.enum';
import { TipoCambioCliente } from '../../domain/enums/tipo-cambio-cliente.enum';
import {
  ClienteEliminadoError,
  ClienteNoEncontradoError,
} from '../../domain/errors/cliente.errors';
import { ClienteRepositoryFake } from '../../test/fakes/cliente-repository.fake';
import {
  ContratoFisicoPort,
  GuardarContratoFisico,
} from '../ports/contrato-fisico.port';
import { PrimeraFacturaPort } from '../ports/primera-factura.port';
import { ActualizarClienteUseCase } from './actualizar-cliente.use-case';
import { ActualizarIpClienteUseCase } from './actualizar-ip-cliente.use-case';
import {
  CrearClienteInput,
  CrearClienteUseCase,
} from './crear-cliente.use-case';

const AHORA = new Date('2026-11-26T18:00:00.000Z');
const { ACTIVO, SUSPENDIDO, DESINSTALADO } = EstadoOperativoCliente;

describe('alta y edición de clientes', () => {
  let clientes: ClienteRepositoryFake;
  let contratosGuardados: GuardarContratoFisico[];
  let contratos: ContratoFisicoPort;
  let unidad: UnidadDeTrabajoEnMemoria;
  let zonasVerificadas: number[];
  let zonas: ZonaFacturacionFacadePort;
  const reloj = new RelojFijo(AHORA);

  beforeEach(() => {
    clientes = new ClienteRepositoryFake();
    contratosGuardados = [];
    contratos = {
      guardar: (c) => {
        contratosGuardados.push(c);
        return Promise.resolve();
      },
    };
    unidad = new UnidadDeTrabajoEnMemoria();
    zonasVerificadas = [];
    // La zona 99 no admite clientes.
    zonas = {
      verificarAsignable: (id) => {
        zonasVerificadas.push(id);
        return id === 99
          ? Promise.reject(new Error('zona eliminada'))
          : Promise.resolve();
      },
    };
  });

  describe('CrearClienteUseCase', () => {
    const input: CrearClienteInput = {
      cliente: {
        nombre: 'Ana',
        estadoInicial: ACTIVO,
        empresaId: 1,
        facturacionZonaId: 2,
        servicioInternetId: 3,
        mikrotikRouterId: 5,
      },
      ip: { direccionIp: '10.0.0.2' },
      coordenadas: ['15.3', '-91.4'],
      servicioIds: [8],
      contrato: { idContrato: 'C-1' },
    };

    function crear(factura?: PrimeraFacturaPort) {
      return new CrearClienteUseCase(
        clientes,
        factura ?? {
          generar: () =>
            Promise.resolve({
              estadoCobranza: EstadoCobranzaCliente.PAGO_PENDIENTE,
            }),
        },
        contratos,
        unidad,
        zonas,
        reloj,
      );
    }

    it('guarda cliente, ubicación, IP, servicios, cobranza y contrato juntos', async () => {
      const cliente = await crear().execute(input);
      const id = cliente.id!;

      expect(cliente.toPrimitives()).toMatchObject({
        estadoCliente: ACTIVO,
        estadoCobranza: EstadoCobranzaCliente.PAGO_PENDIENTE,
        estadoServicioMikrotik: EstadoServicioMikrotik.PENDIENTE_APLICAR,
      });
      expect(clientes.ubicaciones.get(id)).toEqual({
        latitud: 15.3,
        longitud: -91.4,
      });
      expect(clientes.ips.get(id)).toEqual({ direccionIp: '10.0.0.2' });
      expect(clientes.servicios.get(id)).toEqual([8]);
      expect(contratosGuardados).toEqual([
        { idContrato: 'C-1', clienteId: id },
      ]);
      expect(unidad.aperturas).toHaveLength(1);
    });

    it('sin coordenadas ni contrato no los registra', async () => {
      const cliente = await crear().execute({
        ...input,
        coordenadas: [],
        contrato: null,
      });

      expect(clientes.ubicaciones.has(cliente.id!)).toBe(false);
      expect(contratosGuardados).toHaveLength(0);
    });

    it('no guarda nada si la zona no admite clientes', async () => {
      await expect(
        crear().execute({
          ...input,
          cliente: { ...input.cliente, facturacionZonaId: 99 },
        }),
      ).rejects.toThrow('zona eliminada');
      expect(clientes.ips.size).toBe(0);
      expect(contratosGuardados).toHaveLength(0);
    });

    it('si la factura falla, el alta falla', async () => {
      const factura = {
        generar: () => Promise.reject(new Error('zona caída')),
      };

      await expect(crear(factura).execute(input)).rejects.toThrow('zona caída');
      expect(contratosGuardados).toHaveLength(0);
    });
  });

  describe('ActualizarClienteUseCase', () => {
    const base = {
      clienteId: 7,
      usuarioId: 4,
      empresaId: 1,
      perfil: { nombre: 'María' },
      asignaciones: {},
    };
    const actualizar = () =>
      new ActualizarClienteUseCase(clientes, contratos, unidad, zonas, reloj);

    it('lo que no llega no se toca', async () => {
      clientes.sembrar({
        telefono: '12345678',
        estadoCliente: SUSPENDIDO,
        estadoCobranza: EstadoCobranzaCliente.MOROSO,
      });

      await actualizar().execute(base);

      expect(clientes.filas.get(7)).toMatchObject({
        telefono: '12345678',
        estadoCliente: SUSPENDIDO,
        estadoCobranza: EstadoCobranzaCliente.MOROSO,
      });
      expect(clientes.servicios.has(7)).toBe(false);
      expect(clientes.historial).toHaveLength(0);
    });

    it('una lista vacía quita los servicios', async () => {
      clientes.sembrar();

      await actualizar().execute({ ...base, servicioIds: [] });

      expect(clientes.servicios.get(7)).toEqual([]);
    });

    it('verifica la zona solo cuando llega una', async () => {
      clientes.sembrar();

      await actualizar().execute(base);
      expect(zonasVerificadas).toEqual([]);

      await expect(
        actualizar().execute({
          ...base,
          asignaciones: { facturacionZonaId: 99 },
        }),
      ).rejects.toThrow('zona eliminada');
      expect(zonasVerificadas).toEqual([99]);
    });

    it('un cambio manual de estado queda en el historial', async () => {
      clientes.sembrar();

      await actualizar().execute({ ...base, estado: DESINSTALADO });

      expect(clientes.filas.get(7)).toMatchObject({
        estadoCliente: DESINSTALADO,
        desinstaladoEn: AHORA,
      });
      expect(clientes.historial).toEqual([
        expect.objectContaining({
          tipoCambio: TipoCambioCliente.DESINSTALACION,
          estadoAnterior: ACTIVO,
          cambiadoPorId: 4,
        }),
      ]);
    });

    it('inexistente o eliminado', async () => {
      await expect(actualizar().execute(base)).rejects.toThrow(
        ClienteNoEncontradoError,
      );

      clientes.sembrar({ isEliminado: true });
      await expect(actualizar().execute(base)).rejects.toThrow(
        ClienteEliminadoError,
      );
    });
  });

  describe('ActualizarIpClienteUseCase', () => {
    const input = {
      clienteId: 7,
      direccionIp: '10.0.0.9',
      gateway: '10.0.0.1',
      mascara: '255.255.255.0',
    };

    it('guarda la IP de un cliente vigente', async () => {
      clientes.sembrar();

      await expect(
        new ActualizarIpClienteUseCase(clientes).execute(input),
      ).resolves.toMatchObject({ clienteId: 7, direccionIp: '10.0.0.9' });
    });

    it('rechaza a un cliente eliminado', async () => {
      clientes.sembrar({ isEliminado: true });

      await expect(
        new ActualizarIpClienteUseCase(clientes).execute(input),
      ).rejects.toThrow(ClienteEliminadoError);
    });
  });
});
