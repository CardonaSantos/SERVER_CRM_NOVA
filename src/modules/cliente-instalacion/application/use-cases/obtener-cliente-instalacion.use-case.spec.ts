import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import { ClienteInstalacionNoEncontradaError } from '../../domain/errors/cliente-instalacion.errors';
import { ClienteInstalacionDetalle } from '../../domain/read-models/cliente-instalacion-detalle.read-model';
import { ClienteInstalacionTechnicalDetail } from '../../domain/read-models/instalacion-tecnica.read-model';
import { ClienteInstalacionQueryFake } from '../../test/fakes/cliente-instalacion-query.fake';
import { ObtenerClienteInstalacionUseCase } from './obtener-cliente-instalacion.use-case';
import { ObtenerDetalleTecnicoInstalacionUseCase } from './obtener-detalle-tecnico-instalacion.use-case';

describe('ObtenerClienteInstalacionUseCase', () => {
  it('devuelve el detalle o 404 de dominio', async () => {
    const consultas = new ClienteInstalacionQueryFake();
    consultas.detalles.set(5, {
      instalacion: { id: 5 },
    } as ClienteInstalacionDetalle);
    const useCase = new ObtenerClienteInstalacionUseCase(consultas);

    await expect(useCase.execute({ id: 5 })).resolves.toMatchObject({
      instalacion: { id: 5 },
    });
    await expect(useCase.execute({ id: 6 })).rejects.toThrow(
      ClienteInstalacionNoEncontradaError,
    );
  });
});

describe('ObtenerDetalleTecnicoInstalacionUseCase', () => {
  it('agrega las acciones que el técnico puede hacer según el estado', async () => {
    const consultas = new ClienteInstalacionQueryFake();
    consultas.tecnicos.set(5, {
      instalacion: { id: 5, estado: EstadoInstalacionCliente.EN_PROCESO },
      accesos: [{ metodoAutenticacion: 'PPPOE', cuentaPppoe: null }],
    } as unknown as ClienteInstalacionTechnicalDetail);
    const useCase = new ObtenerDetalleTecnicoInstalacionUseCase(consultas);

    const r = await useCase.execute({ instalacionId: 5, actorId: 3 });

    expect(r.acciones.completar.habilitada).toBe(true);
    expect(r.acciones.iniciar.habilitada).toBe(false);
    expect(r.acciones.reintentarPrealta.habilitada).toBe(true);
  });

  it('si el técnico no figura asignado: 404 de dominio', async () => {
    const useCase = new ObtenerDetalleTecnicoInstalacionUseCase(
      new ClienteInstalacionQueryFake(),
    );

    await expect(
      useCase.execute({ instalacionId: 5, actorId: 3 }),
    ).rejects.toThrow(ClienteInstalacionNoEncontradaError);
  });
});
