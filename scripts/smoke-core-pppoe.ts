import { strict as assert } from 'node:assert';

import { Money } from 'src/shared/domain/value-objects/money.vo';

import { ClienteInstalacionEntity } from 'src/modules/cliente-instalacion/domain/entities/cliente-instalacion.entity';
import { EstadoInstalacionCliente } from 'src/modules/cliente-instalacion/domain/enums/estado-instalacion-cliente.enum';
import { TipoInstalacionCliente } from 'src/modules/cliente-instalacion/domain/enums/tipo-instalacion-cliente.enum';

import { ClientePppoeCuentaEntity } from 'src/modules/pppoe-cliente-cuenta/domain/entities/ppoe-cliente-cuenta.entity';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';
import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';
import {
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
} from 'src/modules/pppoe-operacion/domain/ports/pppoe-operacion-repository.port';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';
import { CrearPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/crear-pppoe-operacion.use-case.ts';

type ResultadoSmoke = {
  prueba: string;
  estado: 'OK' | 'FALLO';
  duracionMs: number;
  detalle: string;
};

type PasoInicialCapturado = {
  tipo: TipoPasoPppoe;
  orden: number;
};

function sumarMs(fecha: Date, ms: number): Date {
  return new Date(fecha.getTime() + ms);
}

/**
 * Repositorio mínimo en memoria para probar el caso de uso
 * de creación de operaciones sin Prisma ni base de datos.
 */
class PppoeOperacionMemoryRepository {
  private secuencia = 0;

  private readonly agregados = new Map<number, PppoeOperacionAggregate>();

  private readonly operacionesPorClave = new Map<
    string,
    PppoeOperacionEntity
  >();

  readonly planes = new Map<TipoOperacionPppoe, PasoInicialCapturado[]>();

  async findByIdempotencyKey(params: {
    empresaId: number;
    claveIdempotencia: string;
  }): Promise<PppoeOperacionEntity | null> {
    return (
      this.operacionesPorClave.get(
        this.clave(params.empresaId, params.claveIdempotencia),
      ) ?? null
    );
  }

  async findRunningOperation(params: {
    empresaId: number;
    cuentaPppoeId: number;
    estados: EstadoOperacionPppoe[];
    excluirOperacionId?: number | null;
  }): Promise<PppoeOperacionEntity | null> {
    for (const aggregate of this.agregados.values()) {
      const operation = aggregate.operacion;

      if (operation.empresaId !== params.empresaId) continue;
      if (operation.cuentaPppoeId !== params.cuentaPppoeId) continue;
      if (params.excluirOperacionId === operation.id) continue;
      if (!params.estados.includes(operation.estado)) continue;

      return operation;
    }

    return null;
  }

  async createWithSteps(params: {
    operacion: PppoeOperacionEntity;
    pasos: PasoInicialCapturado[];
  }): Promise<PppoeOperacionAggregate> {
    const id = ++this.secuencia;

    const persistedOperation = PppoeOperacionEntity.restore({
      ...params.operacion.toPrimitives(),
      id,
    });

    const aggregate: PppoeOperacionAggregate = {
      operacion: persistedOperation,
      pasos: [],
    };

    this.agregados.set(id, aggregate);

    this.operacionesPorClave.set(
      this.clave(
        persistedOperation.empresaId,
        persistedOperation.toPrimitives().claveIdempotencia,
      ),
      persistedOperation,
    );

    this.planes.set(
      persistedOperation.tipo,
      params.pasos.map((paso) => ({ ...paso })),
    );

    return aggregate;
  }

  async findAggregateById(params: {
    empresaId: number;
    operacionId: number;
  }): Promise<PppoeOperacionAggregate | null> {
    const aggregate = this.agregados.get(params.operacionId) ?? null;

    if (!aggregate || aggregate.operacion.empresaId !== params.empresaId) {
      return null;
    }

    return aggregate;
  }

  private clave(empresaId: number, claveIdempotencia: string): string {
    return `${empresaId}:${claveIdempotencia.trim()}`;
  }
}

async function ejecutarPrueba(
  resultados: ResultadoSmoke[],
  prueba: string,
  fn: () => void | Promise<void>,
): Promise<void> {
  const inicio = Date.now();

  try {
    await fn();

    resultados.push({
      prueba,
      estado: 'OK',
      duracionMs: Date.now() - inicio,
      detalle: 'Comportamiento esperado confirmado.',
    });
  } catch (error: unknown) {
    resultados.push({
      prueba,
      estado: 'FALLO',
      duracionMs: Date.now() - inicio,
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
}

function crearCuentaPppoePersistida(): ClientePppoeCuentaEntity {
  const base = new Date();

  return ClientePppoeCuentaEntity.hydrate({
    id: 101,
    empresaId: 1,
    accesoInternetId: 201,
    perfilHomologacionId: 301,
    usuario: 'smoke-core-pppoe',
    secretoCifrado: 'cipher-smoke-no-es-password-real',
    secretoIv: 'iv-smoke',
    secretoAuthTag: 'auth-tag-smoke',
    versionClave: 1,
    estado: EstadoCuentaPppoe.PENDIENTE_ACTIVACION,
    generadoPorId: 1,
    generadoEn: base,
    secretCreadoEn: null,
    activadoEn: null,
    suspendidoEn: null,
    eliminadoEn: null,
    ultimaSincronizacionEn: null,
    ultimoError: null,
    actualizadoEn: base,
  });
}

function crearInstalacionPersistida(): ClienteInstalacionEntity {
  const base = new Date();

  return ClienteInstalacionEntity.hydrate({
    id: 401,
    empresaId: 1,
    clienteId: 501,
    servicioInternetId: 601,
    ticketId: null,
    asesorId: null,
    creadoPorId: 1,
    completadoPorId: null,
    tipo: TipoInstalacionCliente.NUEVA,
    estado: EstadoInstalacionCliente.PROGRAMADA,
    fechaProgramada: base,
    fechaInicio: null,
    fechaFinalizacion: null,
    fechaCancelacion: null,
    fechaActivacionServicio: null,
    motivo: null,
    observaciones: null,
    resultado: null,
    direccionInstalacion: 'Dirección ficticia de smoke test',
    referenciaUbicacion: null,
    latitud: null,
    longitud: null,
    descripcion: 'Instalación ficticia; no se persiste.',
    costoInstalacion: Money.zero(),
    costoMateriales: Money.zero(),
    costoManoObra: Money.zero(),
    costoOtros: Money.zero(),
    montoCobradoCliente: Money.zero(),
    notasCostos: null,
    creadoEn: base,
    actualizadoEn: base,
  });
}

function crearOperacionSimple(
  claveIdempotencia = 'smoke:operacion:entidad',
): PppoeOperacionEntity {
  return PppoeOperacionEntity.create({
    empresaId: 1,
    cuentaPppoeId: 101,
    mikrotikRouterId: 701,
    perfilHomologacionId: 301,
    instalacionId: 401,
    desinstalacionId: null,
    reintentoDeId: null,
    numeroIntento: 1,
    claveIdempotencia,
    tipo: TipoOperacionPppoe.CREAR_SECRET,
    origen: OrigenOperacionPppoe.SISTEMA,
    iniciadoPorId: null,
    requiereReautenticacion: false,
    motivo: 'Smoke test de entidad de operación.',
    usuarioPppoeSnapshot: 'smoke-core-pppoe',
    codigoPerfilSnapshot: 'SMOKE_PROFILE',
    routerHostSnapshot: '192.0.2.10',
    routerPuertoSnapshot: 22,
  });
}

async function main(): Promise<void> {
  const resultados: ResultadoSmoke[] = [];

  await ejecutarPrueba(
    resultados,
    'ClienteInstalacionEntity: PROGRAMADA -> EN_PROCESO -> COMPLETADA -> servicio activado',
    () => {
      const instalacion = crearInstalacionPersistida();
      const base = instalacion.toPrimitives().creadoEn ?? new Date();

      instalacion.iniciar({ fechaInicio: sumarMs(base, 10) });
      assert.equal(instalacion.estado, EstadoInstalacionCliente.EN_PROCESO);

      instalacion.completar({
        completadoPorId: 1,
        resultado: 'Smoke test completado',
        observaciones: null,
        fechaFinalizacion: sumarMs(base, 20),
      });

      assert.equal(instalacion.estado, EstadoInstalacionCliente.COMPLETADA);

      instalacion.marcarServicioActivado(sumarMs(base, 30));

      assert.ok(instalacion.toPrimitives().fechaActivacionServicio);

      assert.throws(() => instalacion.iniciar(), /Solo una instalación/);
    },
  );

  await ejecutarPrueba(
    resultados,
    'ClientePppoeCuentaEntity: ciclo completo de instalación, activación, suspensión y eliminación',
    () => {
      const cuenta = crearCuentaPppoePersistida();
      const base = cuenta.generadoEn;

      cuenta.iniciarInstalacion(sumarMs(base, 10));
      assert.equal(cuenta.estado, EstadoCuentaPppoe.EN_INSTALACION);

      cuenta.marcarSecretCreado(sumarMs(base, 20));
      assert.equal(cuenta.tieneSecretCreado, true);

      cuenta.iniciarActivacion(sumarMs(base, 30));
      assert.equal(cuenta.estado, EstadoCuentaPppoe.EN_ACTIVACION);

      cuenta.marcarActiva(sumarMs(base, 40));
      assert.equal(cuenta.estado, EstadoCuentaPppoe.ACTIVA);

      cuenta.marcarSuspendida(sumarMs(base, 50));
      assert.equal(cuenta.estado, EstadoCuentaPppoe.SUSPENDIDA);

      cuenta.iniciarActivacion(sumarMs(base, 60));
      cuenta.marcarActiva(sumarMs(base, 70));

      cuenta.iniciarDesinstalacion(sumarMs(base, 80));
      assert.equal(cuenta.estado, EstadoCuentaPppoe.EN_DESINSTALACION);

      cuenta.marcarEliminada(sumarMs(base, 90));
      assert.equal(cuenta.estado, EstadoCuentaPppoe.ELIMINADA);
      assert.equal(cuenta.estaEliminada, true);
    },
  );

  await ejecutarPrueba(
    resultados,
    'PppoeOperacionEntity: PENDIENTE -> EJECUTANDO -> EXITOSA',
    () => {
      const operation = crearOperacionSimple();
      const createdAt = operation.toPrimitives().creadoEn;

      operation.iniciar({ fecha: sumarMs(createdAt, 10) });
      assert.equal(operation.estado, EstadoOperacionPppoe.EJECUTANDO);

      operation.marcarExitosa({
        resultado: {
          secretEncontrado: false,
          secretCreado: true,
          secretConfirmado: true,
        },
        fecha: sumarMs(createdAt, 20),
      });

      assert.equal(operation.estado, EstadoOperacionPppoe.EXITOSA);
      assert.equal(operation.esTerminal(), true);
    },
  );

  await ejecutarPrueba(
    resultados,
    'PppoeOperacionEntity: bloquea datos sensibles dentro del resultado',
    () => {
      const operation = crearOperacionSimple('smoke:operacion:sensible');

      const createdAt = operation.toPrimitives().creadoEn;

      operation.iniciar({ fecha: sumarMs(createdAt, 10) });

      assert.throws(() =>
        operation.marcarExitosa({
          resultado: {
            password: 'esto-no-debe-guardarse',
          },
          fecha: sumarMs(createdAt, 20),
        }),
      );
    },
  );

  await ejecutarPrueba(
    resultados,
    'CrearPppoeOperacionUseCase: planes técnicos e idempotencia en memoria',
    async () => {
      const repository = new PppoeOperacionMemoryRepository();

      const useCase = new CrearPppoeOperacionUseCase(
        repository as unknown as PppoeOperacionRepositoryPort,
      );

      const escenarios: Array<{
        tipo: TipoOperacionPppoe;
        cuentaPppoeId: number;
        pasos: TipoPasoPppoe[];
        requiereReautenticacion: boolean;
      }> = [
        {
          tipo: TipoOperacionPppoe.CREAR_SECRET,
          cuentaPppoeId: 1001,
          pasos: [
            TipoPasoPppoe.CONECTAR_ROUTER,
            TipoPasoPppoe.BUSCAR_SECRET,
            TipoPasoPppoe.AGREGAR_SECRET,
            TipoPasoPppoe.CONFIRMAR_SECRET,
          ],
          requiereReautenticacion: true,
        },
        {
          tipo: TipoOperacionPppoe.ACTIVAR_SECRET,
          cuentaPppoeId: 1002,
          pasos: [
            TipoPasoPppoe.CONECTAR_ROUTER,
            TipoPasoPppoe.BUSCAR_SECRET,
            TipoPasoPppoe.HABILITAR_SECRET,
            TipoPasoPppoe.CONFIRMAR_SECRET,
          ],
          requiereReautenticacion: false,
        },
        {
          tipo: TipoOperacionPppoe.SUSPENDER_SERVICIO,
          cuentaPppoeId: 1003,
          pasos: [
            TipoPasoPppoe.CONECTAR_ROUTER,
            TipoPasoPppoe.BUSCAR_SECRET,
            TipoPasoPppoe.DESHABILITAR_SECRET,
            TipoPasoPppoe.REMOVER_SESION_ACTIVA,
            TipoPasoPppoe.CONFIRMAR_SECRET,
          ],
          requiereReautenticacion: false,
        },
        {
          tipo: TipoOperacionPppoe.ELIMINAR_SECRET,
          cuentaPppoeId: 1004,
          pasos: [
            TipoPasoPppoe.CONECTAR_ROUTER,
            TipoPasoPppoe.BUSCAR_SECRET,
            TipoPasoPppoe.DESHABILITAR_SECRET,
            TipoPasoPppoe.REMOVER_SESION_ACTIVA,
            TipoPasoPppoe.ELIMINAR_SECRET,
            TipoPasoPppoe.CONFIRMAR_SECRET,
          ],
          requiereReautenticacion: true,
        },
      ];

      for (const escenario of escenarios) {
        const input = {
          empresaId: 1,
          cuentaPppoeId: escenario.cuentaPppoeId,
          mikrotikRouterId: 701,
          perfilHomologacionId: 301,
          instalacionId: 401,
          desinstalacionId:
            escenario.tipo === TipoOperacionPppoe.ELIMINAR_SECRET ? 801 : null,
          claveIdempotencia: `smoke:plan:${escenario.tipo}`,
          tipo: escenario.tipo,
          origen: OrigenOperacionPppoe.SISTEMA,
          iniciadoPorId: null,
          motivo: `Smoke plan ${escenario.tipo}`,
          usuarioPppoeSnapshot: `smoke-${escenario.cuentaPppoeId}`,
          codigoPerfilSnapshot: 'SMOKE_PROFILE',
          routerHostSnapshot: '192.0.2.10',
          routerPuertoSnapshot: 22,
        };

        const first = await useCase.execute(input);
        const second = await useCase.execute(input);

        assert.equal(first.operacion.id, second.operacion.id);

        assert.equal(
          first.operacion.toPrimitives().requiereReautenticacion,
          escenario.requiereReautenticacion,
        );

        assert.deepEqual(
          repository.planes.get(escenario.tipo),
          escenario.pasos.map((tipo, index) => ({
            tipo,
            orden: index + 1,
          })),
        );
      }
    },
  );

  console.log('\nSMOKE TEST CORE - SIN DB, SIN PRISMA, SIN SSH\n');
  console.table(resultados);

  const fallos = resultados.filter((resultado) => resultado.estado === 'FALLO');

  if (fallos.length > 0) {
    process.exitCode = 1;
    console.error(`\nFallaron ${fallos.length} prueba(s).`);
    return;
  }

  console.log(
    `\nTodas las pruebas pasaron: ${resultados.length}/${resultados.length}.`,
  );
}

void main().catch((error: unknown) => {
  process.exitCode = 1;
  console.error('\nEl smoke test no pudo ejecutarse.');
  console.error(error);
});
