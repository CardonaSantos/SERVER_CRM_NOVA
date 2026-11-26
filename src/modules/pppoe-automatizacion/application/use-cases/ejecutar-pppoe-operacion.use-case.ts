import { Inject, Injectable, Logger } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
} from 'src/modules/mikrotik-ssh/public/mikrotik-ssh.types';
import {
  PPPOE_ACCESO_INTERNET,
  PppoeAccesoInternetFacadePort,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import {
  ClientePppoeCuentaReadModel,
  EstadoCuentaPppoe,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import {
  PPPOE_OPERACION,
  PppoeOperacionFacadePort,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.facade.port';
import {
  EstadoOperacionPppoe,
  PppoeOperacionAgregadoReadModel,
  PppoeOperacionPasoReadModel,
  PppoeOperacionReadModel,
  PppoeOperacionResultado,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import {
  OperacionPppoeRequiereRecuperacionError,
  PppoeOperacionStepError,
  ProvisionamientoPppoeDatosInvalidosError,
  ProvisionamientoPppoeEstadoInvalidoError,
} from '../../domain/errors/pppoe-automatizacion.errors';
import { huboPosibleEfectoRemoto } from '../../domain/policies/efecto-remoto-pppoe.policy';
import { EjecutarOperacionPppoeResult } from '../../public/pppoe-provisionamiento.port';
import {
  PPPOE_OPERACION_AUDITORIA,
  PppoeOperacionAuditoriaPort,
} from '../ports/pppoe-operacion-auditoria.port';
import { EjecutorActivarSecretPppoeService } from '../services/ejecutor-activar-secret-pppoe.service';
import { EjecutorCrearSecretPppoeService } from '../services/ejecutor-crear-secret-pppoe.service';
import { EjecutorEliminarSecretPppoeService } from '../services/ejecutor-eliminar-secret-pppoe.service';
import { EjecutorSuspenderServicioPppoeService } from '../services/ejecutor-suspender-servicio-pppoe.service';
import { PppoeOperacionStepRunnerService } from '../services/pppoe-operacion-step-runner.service';
import {
  ContextoEjecucionPppoe,
  ResolverContextoEjecucionPppoeService,
} from '../services/resolver-contexto-ejecucion-pppoe.service';
import { SincronizacionLocalPppoeService } from '../services/sincronizacion-local-pppoe.service';

export type EjecutarPppoeOperacionUseCaseInput = {
  empresaId: number;
  operacionId: number;
  /** Solo para pruebas deterministas; en ejecución normal se omite. */
  fechaInicio?: Date;
};

/** Hasta dónde llegó la ejecución cuando algo falló. */
type Avance = {
  cuentaPreparada: boolean;
  ejecutorIniciado: boolean;
  remotoConfirmado: boolean;
};

const TIPOS_SOPORTADOS = new Set<TipoOperacionPppoe>([
  TipoOperacionPppoe.CREAR_SECRET,
  TipoOperacionPppoe.ACTIVAR_SECRET,
  TipoOperacionPppoe.SUSPENDER_SERVICIO,
  TipoOperacionPppoe.ELIMINAR_SECRET,
]);

/**
 * Ejecuta una operación PPPoE ya creada (crear, activar, suspender o
 * eliminar el secret): la reclama como EJECUTANDO, prepara el estado local,
 * corre los pasos contra el router y sincroniza cuenta, acceso y cliente.
 * Si el router confirmó pero lo local falló, la operación queda EJECUTANDO
 * para la recuperación; nunca se repite un comando remoto a ciegas.
 */
@Injectable()
export class EjecutarPppoeOperacionUseCase {
  private readonly logger = new Logger(EjecutarPppoeOperacionUseCase.name);

  constructor(
    @Inject(RELOJ) private readonly reloj: RelojPort,
    @Inject(PPPOE_OPERACION)
    private readonly operaciones: PppoeOperacionFacadePort,
    private readonly resolverContexto: ResolverContextoEjecucionPppoeService,
    private readonly ejecutorCrearSecret: EjecutorCrearSecretPppoeService,
    private readonly stepRunner: PppoeOperacionStepRunnerService,
    private readonly ejecutorActivarSecret: EjecutorActivarSecretPppoeService,
    private readonly ejecutorSuspenderServicio: EjecutorSuspenderServicioPppoeService,
    private readonly ejecutorEliminarSecret: EjecutorEliminarSecretPppoeService,
    @Inject(PPPOE_OPERACION_AUDITORIA)
    private readonly operacionAuditoria: PppoeOperacionAuditoriaPort,
    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,
    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesosInternet: PppoeAccesoInternetFacadePort,
    private readonly sincronizacion: SincronizacionLocalPppoeService,
  ) {}

  async execute(
    input: EjecutarPppoeOperacionUseCaseInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validarEntrada(input);
    this.logger.log(`[PPPOE] Ejecutando operación ${input.operacionId}`);

    // Se reclama como EJECUTANDO antes de cualquier acción técnica.
    const agregado = await this.operaciones.iniciar({
      operacionId: input.operacionId,
      fecha: input.fechaInicio,
    });
    const { operacion } = agregado;
    if (!TIPOS_SOPORTADOS.has(operacion.tipo)) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        `El motor PPPoE todavía no admite operaciones de tipo ${operacion.tipo}.`,
      );
    }
    // Con pasos ya procesados no se continúa: va por la recuperación.
    const procesado = agregado.pasos.find((paso) => !paso.estaPendiente);
    if (procesado) {
      throw new OperacionPppoeRequiereRecuperacionError(
        `La operación PPPoE ya contiene el paso ${procesado.orden} en estado ${procesado.estado}. Debe pasar por recuperación antes de continuar.`,
      );
    }
    await this.operacionAuditoria.registrarIniciada({
      operacion,
      fecha: input.fechaInicio,
    });

    const avance: Avance = {
      cuentaPreparada: false,
      ejecutorIniciado: false,
      remotoConfirmado: false,
    };
    let cuenta: ClientePppoeCuentaReadModel | null = null;
    let estadoCuentaInicial: EstadoCuentaPppoe | null = null;

    try {
      let contexto = await this.resolverContexto.resolve(operacion);
      estadoCuentaInicial = contexto.cuenta.estado;

      let acceso = await this.accesosInternet.buscarPorId(
        contexto.cuenta.accesoInternetId,
      );
      if (!acceso) {
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          'No existe el acceso de internet asociado a la cuenta PPPoE.',
        );
      }

      cuenta = await this.sincronizacion.prepararCuenta(
        operacion,
        contexto.cuenta,
      );
      avance.cuentaPreparada = true;
      acceso = await this.sincronizacion.prepararAcceso(operacion, acceso);
      contexto = { ...contexto, cuenta };

      avance.ejecutorIniciado = true;
      const resultado = await this.ejecutarEnRouter(contexto, agregado.pasos);
      // El ejecutor solo regresa cuando el router confirmó el resultado.
      avance.remotoConfirmado = true;

      ({ cuenta } = await this.sincronizacion.confirmarResultado(
        operacion,
        cuenta,
        this.reloj.ahora(),
        acceso,
      ));

      const final = await this.operaciones.finalizar({
        operacionId: input.operacionId,
        estadoFinal: EstadoOperacionPppoe.EXITOSA,
        resultado,
      });
      await this.operacionAuditoria.registrarFinalizada({
        operacion: final.operacion,
        estadoCuentaAnterior: estadoCuentaInicial,
        estadoCuentaNuevo: cuenta.estado,
      });
      return this.resultado(final.operacion, cuenta, null);
    } catch (error: unknown) {
      if (avance.remotoConfirmado) {
        throw new OperacionPppoeRequiereRecuperacionError(
          'La operación PPPoE confirmó el estado remoto, pero no pudo completar su sincronización local. Requiere recuperación.',
        );
      }
      return this.cerrarConFallo({
        input,
        operacion,
        error,
        avance,
        cuenta,
        estadoCuentaInicial,
      });
    }
  }

  /** Cierra como FALLIDA o PARCIAL un intento que no confirmó en el router. */
  private async cerrarConFallo(params: {
    input: EjecutarPppoeOperacionUseCaseInput;
    operacion: PppoeOperacionReadModel;
    error: unknown;
    avance: Avance;
    cuenta: ClientePppoeCuentaReadModel | null;
    estadoCuentaInicial: EstadoCuentaPppoe | null;
  }): Promise<EjecutarOperacionPppoeResult> {
    const { input, avance } = params;
    const fallo = normalizarError(params.error, avance.ejecutorIniciado);
    this.logger.error(
      `[PPPOE] Operación fallida operacionId=${input.operacionId} tipo=${params.operacion.tipo} codigo=${fallo.errorCodigo} ejecutorIniciado=${avance.ejecutorIniciado}`,
    );

    const conFallo = await this.asegurarPasoFallido(input, fallo);
    let cuenta = params.cuenta;
    if (avance.cuentaPreparada || avance.ejecutorIniciado) {
      cuenta = await this.registrarErrorEnCuenta(
        cuenta,
        conFallo.operacion.cuentaPppoeId,
        fallo.message,
      );
    } else {
      cuenta ??= await this.buscarCuenta(conFallo.operacion.cuentaPppoeId);
    }

    const parcial =
      fallo.debeFinalizarComoParcial() &&
      huboPosibleEfectoRemoto(conFallo.pasos);
    const final = await this.operaciones.finalizar({
      operacionId: input.operacionId,
      estadoFinal: parcial
        ? EstadoOperacionPppoe.PARCIAL
        : EstadoOperacionPppoe.FALLIDA,
      errorCodigo: fallo.errorCodigo,
      errorMensaje: fallo.message,
      resultado: null,
    });

    // Se relee para no devolver un estado de cuenta solo cambiado en memoria.
    const cuentaFinal =
      (await this.buscarCuenta(final.operacion.cuentaPppoeId)) ?? cuenta;
    await this.operacionAuditoria.registrarFinalizada({
      operacion: final.operacion,
      estadoCuentaAnterior: params.estadoCuentaInicial,
      estadoCuentaNuevo: cuentaFinal?.estado ?? null,
    });
    return this.resultado(final.operacion, cuentaFinal, fallo);
  }

  private ejecutarEnRouter(
    contexto: ContextoEjecucionPppoe,
    pasos: PppoeOperacionPasoReadModel[],
  ): Promise<PppoeOperacionResultado> {
    const ejecutores = {
      [TipoOperacionPppoe.CREAR_SECRET]: this.ejecutorCrearSecret,
      [TipoOperacionPppoe.ACTIVAR_SECRET]: this.ejecutorActivarSecret,
      [TipoOperacionPppoe.SUSPENDER_SERVICIO]: this.ejecutorSuspenderServicio,
      [TipoOperacionPppoe.ELIMINAR_SECRET]: this.ejecutorEliminarSecret,
    };
    return ejecutores[contexto.operacion.tipo].execute({ contexto, pasos });
  }

  /**
   * Una operación FALLIDA o PARCIAL necesita un paso FALLIDO. Si el error
   * ocurrió antes de que el ejecutor tomara un paso, se marca el primero
   * pendiente. Un paso que siga EJECUTANDO solo lo cierra la recuperación.
   */
  private async asegurarPasoFallido(
    input: EjecutarPppoeOperacionUseCaseInput,
    fallo: PppoeOperacionStepError,
  ): Promise<PppoeOperacionAgregadoReadModel> {
    let agregado = await this.cargar(input.operacionId);
    const enCurso = agregado.pasos.find((paso) => paso.estaEjecutando);
    if (enCurso) {
      throw new OperacionPppoeRequiereRecuperacionError(
        `La operación PPPoE conserva el paso ${enCurso.orden} en estado EJECUTANDO y requiere recuperación.`,
      );
    }
    if (agregado.pasos.some((paso) => paso.fueFallido)) return agregado;

    const pendiente = [...agregado.pasos]
      .sort((a, b) => a.orden - b.orden)
      .find((paso) => paso.estaPendiente);
    if (!pendiente) {
      throw new OperacionPppoeRequiereRecuperacionError(
        'La operación PPPoE no contiene un paso disponible para registrar el fallo y requiere recuperación.',
      );
    }
    // El runner persiste el paso FALLIDO y siempre vuelve a lanzar el error.
    await this.stepRunner
      .ejecutar({
        empresaId: input.empresaId,
        operacionId: input.operacionId,
        orden: pendiente.orden,
        comandoSanitizado: 'INTERRUMPIR_PASO_POR_ERROR_PREVIO',
        ejecutar: () => Promise.reject(fallo),
      })
      .catch(() => undefined);

    agregado = await this.cargar(input.operacionId);
    const sigueEnCurso = agregado.pasos.find((paso) => paso.estaEjecutando);
    if (sigueEnCurso) {
      throw new OperacionPppoeRequiereRecuperacionError(
        `El paso ${sigueEnCurso.orden} no pudo finalizarse y la operación PPPoE requiere recuperación.`,
      );
    }
    if (!agregado.pasos.some((paso) => paso.fueFallido)) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'No pudo registrarse el fallo técnico de la operación PPPoE.',
      );
    }
    return agregado;
  }

  /** Anota el error en la cuenta sin ocultar el error técnico principal. */
  private async registrarErrorEnCuenta(
    cuenta: ClientePppoeCuentaReadModel | null,
    cuentaPppoeId: number,
    mensaje: string,
  ): Promise<ClientePppoeCuentaReadModel | null> {
    try {
      const actual =
        cuenta ?? (await this.cuentasPppoe.buscarPorId(cuentaPppoeId));
      if (!actual || actual.estaEliminada) return actual;
      return await this.cuentasPppoe.registrarError({
        cuentaPppoeId: actual.id,
        mensaje,
      });
    } catch {
      // Si esta escritura falla, la recuperación reconcilia la cuenta.
      return cuenta;
    }
  }

  private async buscarCuenta(
    cuentaPppoeId: number,
  ): Promise<ClientePppoeCuentaReadModel | null> {
    try {
      return await this.cuentasPppoe.buscarPorId(cuentaPppoeId);
    } catch {
      return null;
    }
  }

  private async cargar(
    operacionId: number,
  ): Promise<PppoeOperacionAgregadoReadModel> {
    const agregado = await this.operaciones.buscarAgregado({ operacionId });
    if (!agregado) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'No pudo recargarse la operación PPPoE.',
      );
    }
    return agregado;
  }

  private resultado(
    operacion: PppoeOperacionReadModel,
    cuenta: ClientePppoeCuentaReadModel | null,
    fallo: PppoeOperacionStepError | null,
  ): EjecutarOperacionPppoeResult {
    return {
      operacionId: operacion.id,
      cuentaPppoeId: operacion.cuentaPppoeId,
      tipo: operacion.tipo,
      estadoOperacion: operacion.estado,
      estadoCuenta: cuenta?.estado ?? null,
      numeroIntento: operacion.numeroIntento,
      reintentable:
        operacion.puedeReintentarse && (fallo?.reintentable ?? true),
      resultado: operacion.resultado,
      errorCodigo: operacion.errorCodigo,
      errorMensaje: operacion.errorMensaje,
    };
  }

  private validarEntrada(input: EjecutarPppoeOperacionUseCaseInput): void {
    for (const campo of ['empresaId', 'operacionId'] as const) {
      if (!Number.isInteger(input[campo]) || input[campo] <= 0) {
        throw new ProvisionamientoPppoeDatosInvalidosError(
          `${campo} debe ser un entero positivo.`,
        );
      }
    }
    const fecha = input.fechaInicio;
    if (
      fecha !== undefined &&
      (!(fecha instanceof Date) || Number.isNaN(fecha.getTime()))
    ) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'fechaInicio debe contener una fecha válida.',
      );
    }
  }
}

/**
 * Antes de entregar el control al ejecutor nada tocó el router; después,
 * un error sin clasificar se trata como posible efecto remoto.
 */
function normalizarError(
  error: unknown,
  ejecutorIniciado: boolean,
): PppoeOperacionStepError {
  if (error instanceof PppoeOperacionStepError) return error;
  if (ejecutorIniciado) return PppoeOperacionStepError.from(error);
  return new PppoeOperacionStepError({
    errorCodigo: 'PPPOE_CONTEXTO_EJECUCION_INVALIDO',
    errorMensaje:
      'No pudo prepararse el contexto necesario para ejecutar la operación PPPoE.',
    efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,
    reintentable: true,
    fase: FaseFalloMikrotikSsh.CONFIGURACION,
    cause: error,
  });
}
