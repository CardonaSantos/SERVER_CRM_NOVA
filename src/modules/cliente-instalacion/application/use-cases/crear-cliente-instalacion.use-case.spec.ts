import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { PppoeAccesoInternetFacadePort } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { AccionInstalacionAcceso } from '../../domain/enums/accion-instalacion-acceso.enum';
import { EstadoResultadoPrealtaPppoe } from '../../domain/enums/estado-resultado-prealta-pppoe.enum';
import { ModoAccesoInstalacion } from '../../domain/enums/modo-acceso-instalacion.enum';
import {
  ClienteInstalacionAccesoInvalidoError,
  ClienteInstalacionAccesoNoEncontradoError,
  ClienteInstalacionDatosInvalidosError,
  ClienteInstalacionTecnicoInvalidoError,
} from '../../domain/errors/cliente-instalacion.errors';
import { ClienteInstalacionDetalle } from '../../domain/read-models/cliente-instalacion-detalle.read-model';
import { PppoePrealtaPort } from 'src/modules/pppoe-automatizacion/public/pppoe-prealta.port';
import { ClienteInstalacionAccesoRepositoryFake } from '../../test/fakes/cliente-instalacion-acceso-repository.fake';
import { ClienteInstalacionQueryFake } from '../../test/fakes/cliente-instalacion-query.fake';
import { ClienteInstalacionRepositoryFake } from '../../test/fakes/cliente-instalacion-repository.fake';
import { PppoeAccesoInternetFacadeFake } from '../../test/fakes/pppoe-acceso-internet-facade.fake';
import { PppoePrealtaFake } from '../../test/fakes/pppoe-prealta.fake';
import { ProvisionarAccesoInstalacionService } from '../services/provisionar-acceso-instalacion.service';
import {
  CrearClienteInstalacionInput,
  CrearClienteInstalacionUseCase,
} from './crear-cliente-instalacion.use-case';
import { ServicioFacadePort } from '../../../servicio/public/servicio.facade.port';

const gponPppoe = {
  modo: ModoAccesoInstalacion.NUEVO as const,
  tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
  metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
  mikrotikRouterId: 5,
};

describe('CrearClienteInstalacionUseCase', () => {
  let instalaciones: ClienteInstalacionRepositoryFake;
  let consultas: ClienteInstalacionQueryFake;
  let vinculos: ClienteInstalacionAccesoRepositoryFake;
  let accesos: PppoeAccesoInternetFacadeFake;
  let prealta: PppoePrealtaFake;
  let unidad: UnidadDeTrabajoEnMemoria;
  let useCase: CrearClienteInstalacionUseCase;
  let verificados: object[];
  // El plan 99 no admite asignaciones.
  const servicios: ServicioFacadePort = {
    verificarPlanAsignable: (input) => {
      verificados.push({ ...input, enUnidad: unidad.abierta });
      return input.planId === 99
        ? Promise.reject(new Error('plan inactivo'))
        : Promise.resolve();
    },
    verificarPlanVigente: () => Promise.resolve(),
    verificarServiciosAsignables: () => Promise.resolve(),
  };

  const base = (
    extra: Partial<CrearClienteInstalacionInput> = {},
  ): CrearClienteInstalacionInput => ({
    creadoPorId: 3,
    empresaId: 1,
    clienteId: 7,
    servicioInternetId: 3,
    acceso: gponPppoe,
    ...extra,
  });

  beforeEach(() => {
    instalaciones = new ClienteInstalacionRepositoryFake();
    consultas = new ClienteInstalacionQueryFake();
    vinculos = new ClienteInstalacionAccesoRepositoryFake();
    accesos = new PppoeAccesoInternetFacadeFake();
    prealta = new PppoePrealtaFake();
    unidad = new UnidadDeTrabajoEnMemoria();
    verificados = [];
    consultas.detalles.set(100, {
      instalacion: { id: 100 },
    } as ClienteInstalacionDetalle);

    const servicio = new ProvisionarAccesoInstalacionService(
      accesos as unknown as PppoeAccesoInternetFacadePort,
      vinculos,
      prealta as PppoePrealtaPort,
      new RelojFijo('2026-11-25T15:00:00Z'),
    );

    useCase = new CrearClienteInstalacionUseCase(
      instalaciones,
      consultas,
      unidad,
      servicio,
      servicios,
    );
  });

  it('verifica el plan para el cliente dentro de la unidad', async () => {
    await useCase.execute(base());

    expect(verificados).toEqual([{ planId: 3, clienteId: 7, enUnidad: true }]);
  });

  it('un plan rechazado no crea la instalación', async () => {
    await expect(
      useCase.execute(base({ servicioInternetId: 99 })),
    ).rejects.toThrow('plan inactivo');
    expect(instalaciones.filas.size).toBe(0);
  });

  it('GPON/PPPoE nuevo: crea instalación y vínculo juntos y prepara la prealta después', async () => {
    const dentro: Record<string, boolean> = {};
    const crearOriginal = accesos.crear.bind(accesos);
    accesos.crear = (input) => {
      dentro.acceso = unidad.abierta;
      return crearOriginal(input);
    };
    const prepararOriginal = prealta.preparar.bind(prealta);
    prealta.preparar = (input) => {
      dentro.prealta = unidad.abierta;
      return prepararOriginal(input);
    };

    const resultado = await useCase.execute(base());

    expect(unidad.aperturas).toHaveLength(1);
    expect(dentro).toEqual({ acceso: true, prealta: false });
    expect(vinculos.vinculos.get(100)?.accion).toBe(
      AccionInstalacionAcceso.CREADO,
    );
    expect(resultado.acceso).toMatchObject({
      modo: ModoAccesoInstalacion.NUEVO,
      mikrotikRouterId: 5,
    });
    expect(resultado.prealtaPppoe).toMatchObject({
      aplica: true,
      estado: EstadoResultadoPrealtaPppoe.CREADA,
      reintentable: false,
    });
    expect(prealta.peticiones[0]).toMatchObject({
      instalacionId: 100,
      empresaId: 1,
      servicioInternetId: 3,
      mikrotikRouterId: 5,
      operadorId: 3,
    });
  });

  it('usa la empresa del Input y las coordenadas parseadas', async () => {
    await useCase.execute(base({ empresaId: 9, coordenadas: '14.6, -90.5' }));

    expect(instalaciones.filas.get(100)?.toPrimitives()).toMatchObject({
      empresaId: 9,
      latitud: 14.6,
      longitud: -90.5,
    });
  });

  it('si la prealta falla, la instalación queda creada y la respuesta es FALLIDA y reintentable', async () => {
    prealta.falla = new Error('detalle interno con secretos');

    const { prealtaPppoe } = await useCase.execute(base());

    expect(instalaciones.filas.size).toBe(1);
    expect(prealtaPppoe).toMatchObject({
      estado: EstadoResultadoPrealtaPppoe.FALLIDA,
      reintentable: true,
    });
    expect(JSON.stringify(prealtaPppoe)).not.toContain('secretos');
  });

  it.each([
    [
      'sin router',
      { ...gponPppoe, mikrotikRouterId: undefined },
      3,
      'MikroTik',
    ],
    ['sin servicio', gponPppoe, undefined, 'servicio de internet'],
  ])(
    'GPON/PPPoE %s se rechaza antes de escribir nada',
    async (_n, acceso, servicio, fragmento) => {
      await expect(
        useCase.execute(base({ acceso, servicioInternetId: servicio })),
      ).rejects.toThrow(fragmento);

      expect(instalaciones.filas.size).toBe(0);
      expect(accesos.creados).toHaveLength(0);
    },
  );

  it('acceso existente: se vincula como MODIFICADO y no hay prealta', async () => {
    const existente = accesos.sembrar({
      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    });

    const { acceso, prealtaPppoe } = await useCase.execute(
      base({
        acceso: {
          modo: ModoAccesoInstalacion.EXISTENTE,
          accesoInternetId: existente.id,
        },
      }),
    );

    expect(vinculos.vinculos.get(100)?.accion).toBe(
      AccionInstalacionAcceso.MODIFICADO,
    );
    expect(acceso.modo).toBe(ModoAccesoInstalacion.EXISTENTE);
    expect(prealtaPppoe.estado).toBe(EstadoResultadoPrealtaPppoe.NO_APLICA);
    expect(prealta.peticiones).toHaveLength(0);
  });

  it('un acceso que no es del cliente se rechaza', async () => {
    const ajeno = accesos.sembrar({
      clienteId: 99,
      tecnologia: TecnologiaAccesoInternet.INALAMBRICO,
      metodoAutenticacion: MetodoAutenticacionInternet.DHCP,
    });

    await expect(
      useCase.execute(
        base({
          acceso: {
            modo: ModoAccesoInstalacion.EXISTENTE,
            accesoInternetId: ajeno.id,
          },
        }),
      ),
    ).rejects.toThrow(ClienteInstalacionAccesoNoEncontradoError);
  });

  it('un acceso inalámbrico nuevo no genera prealta', async () => {
    const { prealtaPppoe } = await useCase.execute(
      base({
        acceso: {
          modo: ModoAccesoInstalacion.NUEVO,
          tecnologia: TecnologiaAccesoInternet.INALAMBRICO,
          metodoAutenticacion: MetodoAutenticacionInternet.DHCP,
        },
      }),
    );

    expect(prealtaPppoe.estado).toBe(EstadoResultadoPrealtaPppoe.NO_APLICA);
    expect(prealta.peticiones).toHaveLength(0);
  });

  it('los técnicos se normalizan y se validan antes de escribir', async () => {
    await useCase.execute(
      base({
        tecnicos: [{ tecnicoId: 4 }, { tecnicoId: 5, esResponsable: true }],
      }),
    );

    expect(instalaciones.tecnicosCreados[0]).toEqual([
      expect.objectContaining({ tecnicoId: 4, esResponsable: false }),
      expect.objectContaining({ tecnicoId: 5, esResponsable: true }),
    ]);

    const otra = new ClienteInstalacionRepositoryFake();
    const sinEscribir = new CrearClienteInstalacionUseCase(
      otra,
      consultas,
      unidad,
      new ProvisionarAccesoInstalacionService(
        accesos as unknown as PppoeAccesoInternetFacadePort,
        vinculos,
        prealta,
        new RelojFijo(),
      ),
      servicios,
    );

    await expect(
      sinEscribir.execute(
        base({ tecnicos: [{ tecnicoId: 4 }, { tecnicoId: 4 }] }),
      ),
    ).rejects.toThrow(ClienteInstalacionTecnicoInvalidoError);
    expect(otra.filas.size).toBe(0);
  });

  it('coordenadas inválidas se rechazan con error de dominio', async () => {
    await expect(
      useCase.execute(base({ coordenadas: '200, 0' })),
    ).rejects.toThrow(ClienteInstalacionDatosInvalidosError);
    expect(instalaciones.filas.size).toBe(0);
  });

  it('un acceso con datos imposibles lanza el error de dominio del acceso', async () => {
    await expect(
      useCase.execute(
        base({ acceso: { ...gponPppoe, mikrotikRouterId: undefined } }),
      ),
    ).rejects.toThrow(ClienteInstalacionAccesoInvalidoError);
  });
});
