import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { PppoeAccesoInternetFacadePort } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { TipoCambioCliente } from '../../domain/enums/tipo-cambio-cliente.enum';
import {
  ClienteConAccesoVigenteError,
  ClienteEliminadoError,
  ClienteNoEncontradoError,
} from '../../domain/errors/cliente.errors';
import { ClienteRepositoryFake } from '../../test/fakes/cliente-repository.fake';
import { EliminarClienteUseCase } from './eliminar-cliente.use-case';

const AHORA = new Date('2026-11-26T18:00:00.000Z');
const INPUT = { clienteId: 7, usuarioId: 4, empresaId: 1 };

describe('EliminarClienteUseCase', () => {
  let clientes: ClienteRepositoryFake;
  let estadoAcceso: EstadoAccesoInternet | null;
  let useCase: EliminarClienteUseCase;

  beforeEach(() => {
    clientes = new ClienteRepositoryFake();
    estadoAcceso = null;
    const accesos = {
      buscarPppoeVigenteDelCliente: () =>
        Promise.resolve(estadoAcceso ? { estado: estadoAcceso } : null),
    } as unknown as PppoeAccesoInternetFacadePort;
    useCase = new EliminarClienteUseCase(
      clientes,
      accesos,
      new UnidadDeTrabajoEnMemoria(),
      new RelojFijo(AHORA),
    );
  });

  it('marca al cliente eliminado, conserva sus datos y anota quién fue', async () => {
    clientes.sembrar({ telefono: '12345678' });

    const r = await useCase.execute({ ...INPUT, motivo: ' Duplicado ' });

    expect(r).toEqual({ clienteId: 7, eliminadoEn: AHORA });
    expect(clientes.filas.get(7)).toMatchObject({
      isEliminado: true,
      eliminadoEn: AHORA,
      eliminadoPorId: 4,
      motivoEliminacion: 'Duplicado',
      telefono: '12345678',
    });
    expect(clientes.historial).toEqual([
      expect.objectContaining({
        tipoCambio: TipoCambioCliente.SOFT_DELETE,
        eliminado: { anterior: false, nuevo: true },
        cambiadoPorId: 4,
      }),
    ]);
  });

  it.each([
    EstadoAccesoInternet.ACTIVO,
    EstadoAccesoInternet.SUSPENDIDO,
    EstadoAccesoInternet.CONFIGURANDO,
  ])('con un acceso %s no se elimina', async (estado) => {
    clientes.sembrar();
    estadoAcceso = estado;

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      ClienteConAccesoVigenteError,
    );
    expect(clientes.filas.get(7)?.isEliminado).toBe(false);
  });

  it('un acceso que nunca llegó al router no lo impide', async () => {
    clientes.sembrar();
    estadoAcceso = EstadoAccesoInternet.PENDIENTE;

    await expect(useCase.execute(INPUT)).resolves.toMatchObject({
      clienteId: 7,
    });
  });

  it('inexistente o ya eliminado', async () => {
    await expect(useCase.execute(INPUT)).rejects.toThrow(
      ClienteNoEncontradoError,
    );

    clientes.sembrar({ isEliminado: true });
    await expect(useCase.execute(INPUT)).rejects.toThrow(ClienteEliminadoError);
  });
});
