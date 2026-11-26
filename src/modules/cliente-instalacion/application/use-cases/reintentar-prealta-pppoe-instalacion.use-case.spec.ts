import { PppoeAccesoInternetFacadePort } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { ClienteInstalacionAccesoEntity } from '../../domain/entities/cliente-instalacion-acceso.entity';
import { AccionInstalacionAcceso } from '../../domain/enums/accion-instalacion-acceso.enum';
import { EstadoResultadoPrealtaPppoe } from '../../domain/enums/estado-resultado-prealta-pppoe.enum';
import {
  ClienteInstalacionAccesoNoEncontradoError,
  ClienteInstalacionNoEncontradaError,
  ClienteInstalacionPppoeConflictoError,
} from '../../domain/errors/cliente-instalacion.errors';
import { ClienteInstalacionAccesoRepositoryFake } from '../../test/fakes/cliente-instalacion-acceso-repository.fake';
import { ClienteInstalacionRepositoryFake } from '../../test/fakes/cliente-instalacion-repository.fake';
import { PppoeAccesoInternetFacadeFake } from '../../test/fakes/pppoe-acceso-internet-facade.fake';
import { PppoePrealtaFake } from '../../test/fakes/pppoe-prealta.fake';
import { ReintentarPrealtaPppoeInstalacionUseCase } from './reintentar-prealta-pppoe-instalacion.use-case';

describe('ReintentarPrealtaPppoeInstalacionUseCase', () => {
  let instalaciones: ClienteInstalacionRepositoryFake;
  let vinculos: ClienteInstalacionAccesoRepositoryFake;
  let accesos: PppoeAccesoInternetFacadeFake;
  let prealta: PppoePrealtaFake;
  let useCase: ReintentarPrealtaPppoeInstalacionUseCase;

  const vincular = (accesoInternetId: number) =>
    vinculos.create(
      ClienteInstalacionAccesoEntity.create(
        {
          instalacionId: 100,
          accesoInternetId,
          accion: AccionInstalacionAcceso.CREADO,
        },
        new Date('2026-11-25T15:00:00Z'),
      ),
    );

  const input = (accesoInternetId: number) => ({
    instalacionId: 100,
    accesoInternetId,
    mikrotikRouterId: 5,
    operadorId: 3,
  });

  beforeEach(() => {
    instalaciones = new ClienteInstalacionRepositoryFake();
    vinculos = new ClienteInstalacionAccesoRepositoryFake();
    accesos = new PppoeAccesoInternetFacadeFake();
    prealta = new PppoePrealtaFake();
    instalaciones.sembrar();
    useCase = new ReintentarPrealtaPppoeInstalacionUseCase(
      instalaciones,
      accesos as unknown as PppoeAccesoInternetFacadePort,
      vinculos,
      prealta,
    );
  });

  it('prepara la cuenta del acceso GPON/PPPoE y lo informa', async () => {
    const acceso = accesos.sembrar({
      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    });
    await vincular(acceso.id);

    const r = await useCase.execute(input(acceso.id));

    expect(r).toMatchObject({
      estado: EstadoResultadoPrealtaPppoe.CREADA,
      cuentaPppoeId: 900,
      reintentable: false,
    });
    expect(prealta.peticiones[0]).toMatchObject({
      instalacionId: 100,
      accesoInternetId: acceso.id,
      servicioInternetId: 3,
      mikrotikRouterId: 5,
    });
  });

  it('si la cuenta ya existía responde YA_EXISTIA', async () => {
    const acceso = accesos.sembrar({
      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    });
    await vincular(acceso.id);
    prealta.creada = false;

    expect((await useCase.execute(input(acceso.id))).estado).toBe(
      EstadoResultadoPrealtaPppoe.YA_EXISTIA,
    );
  });

  it('el acceso debe estar vinculado a la instalación', async () => {
    const acceso = accesos.sembrar({
      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    });

    await expect(useCase.execute(input(acceso.id))).rejects.toThrow(
      ClienteInstalacionAccesoNoEncontradoError,
    );
    expect(prealta.peticiones).toHaveLength(0);
  });

  it.each([
    [
      'inalámbrico',
      TecnologiaAccesoInternet.INALAMBRICO,
      MetodoAutenticacionInternet.PPPOE,
      'FIBRA_GPON',
    ],
    [
      'sin PPPoE',
      TecnologiaAccesoInternet.FIBRA_GPON,
      MetodoAutenticacionInternet.DHCP,
      'autenticación PPPoE',
    ],
  ])(
    'un acceso %s no aplica',
    async (_n, tecnologia, metodoAutenticacion, fragmento) => {
      const acceso = accesos.sembrar({ tecnologia, metodoAutenticacion });
      await vincular(acceso.id);

      await expect(useCase.execute(input(acceso.id))).rejects.toThrow(
        fragmento,
      );
    },
  );

  it('el acceso necesita un servicio de internet', async () => {
    const acceso = accesos.sembrar({
      servicioInternetId: null,
      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    });
    await vincular(acceso.id);

    await expect(useCase.execute(input(acceso.id))).rejects.toThrow(
      ClienteInstalacionPppoeConflictoError,
    );
  });

  it('instalación inexistente', async () => {
    await expect(
      useCase.execute({ ...input(1), instalacionId: 999 }),
    ).rejects.toThrow(ClienteInstalacionNoEncontradaError);
  });
});
