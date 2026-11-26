import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { EstadoOperativoCliente } from '../../domain/enums/estado-operativo-cliente.enum';
import { TipoCambioCliente } from '../../domain/enums/tipo-cambio-cliente.enum';
import { ClienteNoEncontradoError } from '../../domain/errors/cliente.errors';
import { ClienteRepositoryFake } from '../../test/fakes/cliente-repository.fake';
import { MarcarClienteDesinstaladoUseCase } from './marcar-cliente-desinstalado.use-case';
import { SincronizarEstadoOperativoClienteUseCase } from './sincronizar-estado-operativo-cliente.use-case';

const FECHA = new Date('2026-11-26T18:00:00.000Z');
const { ACTIVO, SUSPENDIDO, DESINSTALADO } = EstadoOperativoCliente;

describe('estado operativo del cliente', () => {
  let clientes: ClienteRepositoryFake;
  let unidad: UnidadDeTrabajoEnMemoria;

  beforeEach(() => {
    clientes = new ClienteRepositoryFake();
    unidad = new UnidadDeTrabajoEnMemoria();
  });

  describe('SincronizarEstadoOperativoClienteUseCase', () => {
    const sincronizar = () =>
      new SincronizarEstadoOperativoClienteUseCase(clientes, unidad);
    const input = { empresaId: 1, clienteId: 7, cambiadoPorId: 9 };

    it('guarda el estado y lo anota en el historial', async () => {
      clientes.sembrar();

      await sincronizar().execute({ ...input, estado: SUSPENDIDO });

      expect(clientes.filas.get(7)?.estadoCliente).toBe(SUSPENDIDO);
      expect(clientes.historial).toEqual([
        expect.objectContaining({
          tipoCambio: TipoCambioCliente.CAMBIO_ESTADO,
          estadoAnterior: ACTIVO,
          estadoNuevo: SUSPENDIDO,
          cambiadoPorId: 9,
        }),
      ]);
    });

    it('volver a activar a un desinstalado queda como reinstalación', async () => {
      clientes.sembrar({
        estadoCliente: DESINSTALADO,
        desinstaladoEn: FECHA,
      });

      await sincronizar().execute({ ...input, estado: ACTIVO });

      expect(clientes.filas.get(7)?.desinstaladoEn).toBeNull();
      expect(clientes.historial[0].tipoCambio).toBe(
        TipoCambioCliente.REINSTALACION,
      );
    });

    it('repetir el estado no duplica historial', async () => {
      clientes.sembrar();

      await sincronizar().execute({ ...input, estado: ACTIVO });

      expect(clientes.historial).toHaveLength(0);
    });

    it.each([
      ['eliminado', { isEliminado: true }],
      ['de otra empresa', { empresaId: 2 }],
    ])('un cliente %s no se toca', async (_caso, extra) => {
      clientes.sembrar(extra);

      await expect(
        sincronizar().execute({ ...input, estado: SUSPENDIDO }),
      ).rejects.toThrow(ClienteNoEncontradoError);
    });
  });

  describe('MarcarClienteDesinstaladoUseCase', () => {
    const marcar = () => new MarcarClienteDesinstaladoUseCase(clientes, unidad);
    const input = { empresaId: 1, clienteId: 7, fecha: FECHA };

    it('deja al cliente desinstalado, con fecha e historial', async () => {
      clientes.sembrar({ estadoCliente: SUSPENDIDO });

      await marcar().execute(input);
      await marcar().execute(input);

      expect(clientes.filas.get(7)).toMatchObject({
        estadoCliente: DESINSTALADO,
        desinstaladoEn: FECHA,
      });
      expect(clientes.historial).toEqual([
        expect.objectContaining({
          tipoCambio: TipoCambioCliente.DESINSTALACION,
          estadoAnterior: SUSPENDIDO,
        }),
      ]);
    });

    it('cliente inexistente', async () => {
      await expect(marcar().execute(input)).rejects.toThrow(
        ClienteNoEncontradoError,
      );
    });
  });
});
