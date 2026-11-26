import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

import {
  ProvisionamientoPppoeEstadoInvalidoError,
  UsuarioPppoeEnUsoError,
} from '../../domain/errors/pppoe-automatizacion.errors';
import { AdoptarCuentaPppoeExistenteUseCase } from './adoptar-cuenta-pppoe-existente.use-case';

type Puertos = ConstructorParameters<typeof AdoptarCuentaPppoeExistenteUseCase>;
type Sesion = Awaited<ReturnType<Puertos[5]['abrirSesion']>>;
type Verificacion = Awaited<ReturnType<Sesion['verificarCredencialesSecret']>>;

const AHORA = new Date('2026-11-25T16:00:00.000Z');
const PASSWORD_NOVA = 'NV-2026/11/25MH10:00#';

const entrada = {
  empresaId: 1,
  clienteId: 50,
  perfilHomologacionId: 4,
  usuarioPppoe: '  cliente.adoptado ',
  passwordPppoe: PASSWORD_NOVA,
  operadorId: 7,
};

describe('AdoptarCuentaPppoeExistenteUseCase', () => {
  let uow: UnidadDeTrabajoEnMemoria;
  let escrituras: { que: string; dentroDeUnidad: boolean; datos: unknown }[];
  let verificacion: Verificacion;
  let sesionCerrada: boolean;
  let accesoVigente: { estado: string } | null;
  /** Lo que devuelve buscarVigentePorUsuario en cada llamada, en orden. */
  let cuentaConUsuario: (object | null)[];
  let adoptar: AdoptarCuentaPppoeExistenteUseCase;

  const escribir = (que: string, datos: unknown, id: number) => {
    escrituras.push({ que, dentroDeUnidad: uow.abierta, datos });
    return Promise.resolve(id);
  };

  beforeEach(() => {
    uow = new UnidadDeTrabajoEnMemoria();
    escrituras = [];
    sesionCerrada = false;
    accesoVigente = null;
    cuentaConUsuario = [];
    verificacion = {
      duracionMs: 5,
      usuarioPppoe: 'cliente.adoptado',
      encontrado: true,
      passwordCoincide: true,
      secret: {
        codigoPerfil: 'PLAN-10',
        servicio: 'pppoe',
        deshabilitado: false,
      },
    } as Verificacion;

    const accesos = {
      buscarPppoeVigenteDelCliente: () => Promise.resolve(accesoVigente),
      registrarAdoptado: async (d: unknown) => ({
        id: await escribir('acceso', d, 30),
      }),
    } as unknown as Puertos[1];
    const cuentas = {
      buscarVigentePorUsuario: () =>
        Promise.resolve(cuentaConUsuario.shift() ?? null),
      registrarAdoptada: async (d: unknown) => ({
        id: await escribir('cuenta', d, 20),
      }),
    } as unknown as Puertos[2];
    const perfiles = {
      buscarPorId: () =>
        Promise.resolve({
          activo: true,
          mikrotikRouterId: 3,
          servicioInternetId: 9,
          codigoPerfil: 'PLAN-10',
        }),
    } as unknown as Puertos[3];
    const routers = {
      resolve: () =>
        Promise.resolve({
          routerId: 3,
          host: 'router.local',
          port: 22,
          username: 'crm',
          password: 'router-secreto',
        }),
    } as unknown as Puertos[4];
    const ssh = {
      abrirSesion: () =>
        Promise.resolve({
          estaAbierta: () => true,
          verificarCredencialesSecret: () => Promise.resolve(verificacion),
          cerrar: () => {
            sesionCerrada = true;
            return Promise.resolve();
          },
        }),
    } as unknown as Puertos[5];
    const cifrado = {
      encrypt: () =>
        Promise.resolve({
          secretoCifrado: 'cifrado',
          secretoIv: 'iv',
          secretoAuthTag: 'tag',
          versionClave: 1,
        }),
    } as unknown as Puertos[6];
    const auditorias = {
      registrarEventoCuenta: (d: unknown) => escribir('auditoria', d, 99),
    } as unknown as Puertos[7];

    adoptar = new AdoptarCuentaPppoeExistenteUseCase(
      new RelojFijo(AHORA),
      accesos,
      cuentas,
      perfiles,
      routers,
      ssh,
      cifrado,
      auditorias,
      uow,
    );
  });

  it('registra acceso, cuenta y auditoría en una sola unidad SERIALIZABLE', async () => {
    const r = await adoptar.execute(entrada);

    expect(uow.aperturas).toEqual([{ aislamiento: 'SERIALIZABLE' }]);
    expect(escrituras.map((e) => e.que)).toEqual([
      'acceso',
      'cuenta',
      'auditoria',
    ]);
    expect(escrituras.every((e) => e.dentroDeUnidad)).toBe(true);
    expect(sesionCerrada).toBe(true);
    expect(r).toMatchObject({
      accesoInternetId: 30,
      cuentaPppoeId: 20,
      auditoriaId: 99,
      usuarioPppoe: 'cliente.adoptado',
      estadoCuenta: EstadoCuentaPppoe.ACTIVA,
      estadoAcceso: EstadoAccesoInternet.ACTIVO,
      adoptadoEn: AHORA,
      cumpleFormatoNova: true,
      advertencias: [],
    });
  });

  it('nunca guarda la contraseña en claro ni la del router', async () => {
    await adoptar.execute(entrada);

    const guardado = JSON.stringify(escrituras.map((e) => e.datos));
    expect(guardado).not.toContain(PASSWORD_NOVA);
    expect(guardado).not.toContain('router-secreto');
    expect(escrituras[1].datos).toMatchObject({ secretoCifrado: 'cifrado' });
  });

  it('un secret deshabilitado se adopta suspendido', async () => {
    verificacion.secret!.deshabilitado = true;

    const r = await adoptar.execute(entrada);

    expect(r.estadoCuenta).toBe(EstadoCuentaPppoe.SUSPENDIDA);
    expect(r.estadoAcceso).toBe(EstadoAccesoInternet.SUSPENDIDO);
  });

  it('avisa (sin bloquear) por service=any y contraseña fuera del formato NOVA', async () => {
    verificacion.secret!.servicio = 'any';

    const r = await adoptar.execute({ ...entrada, passwordPppoe: 'vieja123' });

    expect(r.cumpleFormatoNova).toBe(false);
    expect(r.advertencias).toHaveLength(2);
  });

  it.each([
    [
      'la contraseña no coincide',
      () => (verificacion.passwordCoincide = false),
    ],
    ['el secret no existe', () => (verificacion.encontrado = false)],
    ['el profile es otro', () => (verificacion.secret!.codigoPerfil = 'OTRO')],
    ['el service no es PPPoE', () => (verificacion.secret!.servicio = 'l2tp')],
  ])(
    'rechaza si %s, cierra la sesión y no guarda nada',
    async (_, preparar) => {
      preparar();

      await expect(adoptar.execute(entrada)).rejects.toBeInstanceOf(
        ProvisionamientoPppoeEstadoInvalidoError,
      );
      expect(sesionCerrada).toBe(true);
      expect(escrituras).toHaveLength(0);
    },
  );

  it('rechaza antes de conectarse si el cliente ya tiene acceso PPPoE', async () => {
    accesoVigente = { estado: 'ACTIVO' };

    await expect(adoptar.execute(entrada)).rejects.toBeInstanceOf(
      ProvisionamientoPppoeEstadoInvalidoError,
    );
    expect(sesionCerrada).toBe(false);
  });

  it('carrera: si el usuario se ocupó tras verificar el router, no escribe nada', async () => {
    // Libre en la comprobación inicial, ocupado al volver a mirar dentro de la unidad.
    cuentaConUsuario = [null, { id: 77 }];

    await expect(adoptar.execute(entrada)).rejects.toBeInstanceOf(
      UsuarioPppoeEnUsoError,
    );
    expect(escrituras).toHaveLength(0);
  });
});
