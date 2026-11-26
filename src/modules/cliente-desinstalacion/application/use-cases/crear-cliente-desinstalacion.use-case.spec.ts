import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { PppoeAccesoInternetFacadePort } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';
import {
  ClienteDesinstalacionAccesoInvalidoError,
  ClienteDesinstalacionAccesoNoEncontradoError,
  TecnicoDesinstalacionConflictoError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionContextoQueryFake } from '../../test/fakes/cliente-desinstalacion-contexto-query.fake';
import { ClienteDesinstalacionRepositoryFake } from '../../test/fakes/cliente-desinstalacion-repository.fake';
import { ClienteDesinstalacionTecnicoRepositoryFake } from '../../test/fakes/cliente-desinstalacion-tecnico-repository.fake';
import { PppoeAccesoInternetFacadeFake } from '../../test/fakes/pppoe-acceso-internet-facade.fake';
import { ValidarAccesoDesinstalacionService } from '../services/validar-acceso-desinstalacion.service';
import {
  CrearClienteDesinstalacionInput,
  CrearClienteDesinstalacionUseCase,
} from './crear-cliente-desinstalacion.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('CrearClienteDesinstalacionUseCase', () => {
  let contexto: ClienteDesinstalacionContextoQueryFake;
  let desinstalaciones: ClienteDesinstalacionRepositoryFake;
  let tecnicos: ClienteDesinstalacionTecnicoRepositoryFake;
  let accesos: PppoeAccesoInternetFacadeFake;
  let unidad: UnidadDeTrabajoEnMemoria;
  let useCase: CrearClienteDesinstalacionUseCase;
  let accesoId: number;

  const input = (
    extra: Partial<CrearClienteDesinstalacionInput> = {},
  ): CrearClienteDesinstalacionInput => ({
    creadoPorId: 3,
    clienteId: 7,
    accesoInternetId: accesoId,
    tipo: TipoDesinstalacionCliente.COMPLETA,
    motivo: MotivoDesinstalacionCliente.VOLUNTARIA,
    fechaProgramada: '2026-12-01T10:00:00Z',
    ...extra,
  });

  beforeEach(() => {
    contexto = new ClienteDesinstalacionContextoQueryFake();
    desinstalaciones = new ClienteDesinstalacionRepositoryFake();
    tecnicos = new ClienteDesinstalacionTecnicoRepositoryFake();
    accesos = new PppoeAccesoInternetFacadeFake();
    unidad = new UnidadDeTrabajoEnMemoria();
    accesoId = accesos.sembrar({
      empresaId: 4,
      servicioInternetId: 3,
      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    }).id;

    useCase = new CrearClienteDesinstalacionUseCase(
      contexto,
      desinstalaciones,
      tecnicos,
      unidad,
      new RelojFijo(AHORA),
      new ValidarAccesoDesinstalacionService(
        accesos as unknown as PppoeAccesoInternetFacadePort,
      ),
    );
  });

  it('crea la solicitud PROGRAMADA con empresa y servicio del acceso y fecha del reloj', async () => {
    const r = await useCase.execute(input());

    expect(r.desinstalacion).toMatchObject({
      estado: EstadoDesinstalacionCliente.PROGRAMADA,
      empresaId: 4,
      servicioInternetId: 3,
      solicitadoPorId: 3,
      creadoPorId: 3,
      ejecutadoPorId: null,
      fechaSolicitud: AHORA,
      fechaProgramada: new Date('2026-12-01T10:00:00Z'),
      requiereRetiroEquipo: true,
      saldoClienteAlMomento: 0,
    });
  });

  it('guarda los técnicos junto con la desinstalación, en una sola transacción', async () => {
    const r = await useCase.execute(
      input({
        tecnicos: [{ tecnicoId: 4, esResponsable: true }, { tecnicoId: 5 }],
      }),
    );

    expect(unidad.aperturas).toHaveLength(1);
    expect(r.tecnicos).toHaveLength(2);
    expect(r.tecnicos[0]).toMatchObject({
      desinstalacionId: 100,
      tecnicoId: 4,
      esResponsable: true,
    });
  });

  it('dos responsables se rechazan antes de escribir nada', async () => {
    await expect(
      useCase.execute(
        input({
          tecnicos: [
            { tecnicoId: 4, esResponsable: true },
            { tecnicoId: 5, esResponsable: true },
          ],
        }),
      ),
    ).rejects.toThrow(TecnicoDesinstalacionConflictoError);

    expect(desinstalaciones.filas.size).toBe(0);
  });

  it('el acceso debe ser del cliente, no estar dado de baja y tener servicio', async () => {
    await expect(
      useCase.execute(input({ accesoInternetId: 999 })),
    ).rejects.toThrow(ClienteDesinstalacionAccesoNoEncontradoError);

    accesos.accesos.set(accesoId, {
      ...accesos.accesos.get(accesoId)!,
      estado: EstadoAccesoInternet.BAJA,
    });
    await expect(useCase.execute(input())).rejects.toThrow(
      'ya se encuentra dado de baja',
    );

    accesos.accesos.set(accesoId, {
      ...accesos.accesos.get(accesoId)!,
      estado: EstadoAccesoInternet.ACTIVO,
      servicioInternetId: null,
    });
    await expect(useCase.execute(input())).rejects.toThrow(
      'servicio de internet',
    );
    expect(desinstalaciones.filas.size).toBe(0);
  });

  it('un ticket que no es del cliente se rechaza', async () => {
    await expect(useCase.execute(input({ ticketId: 12 }))).rejects.toThrow(
      ClienteDesinstalacionAccesoInvalidoError,
    );

    contexto.tickets.add('12:7');
    await expect(
      useCase.execute(input({ ticketId: 12 })),
    ).resolves.toMatchObject({
      desinstalacion: { ticketId: 12 },
    });
  });
});
