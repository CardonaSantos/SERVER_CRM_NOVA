import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { OrigenOperacionPppoe } from '../../../pppoe-auditoria/domain/enums/pppoe-auditoria-enums';
import { PppoeOperacionEntity } from '../../domain/entities/pppoe-operacion.entity';
import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from '../../domain/enums/pppoe-operacion-operacion-paso.enums';
import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
} from '../../domain/ports/pppoe-operacion-repository.port';
import { CrearPppoeOperacionPasoInicialProps } from '../../domain/props/pppoe-operacion-paso.props';

/**
 * INPUT DEL CASO DE USO
 * Datos necesarios para registrar un nuevo intento técnico
 * contra un router MikroTik.
 *
 * Este caso de uso únicamente crea el intento inicial.
 * Los reintentos se administrarán mediante otro caso de uso.
 */
export type CrearPppoeOperacionUseCaseInput = {
  empresaId: number;

  cuentaPppoeId: number;

  mikrotikRouterId: number;
  perfilHomologacionId?: number | null;

  instalacionId?: number | null;

  desinstalacionId?: number | null;

  claveIdempotencia: string;

  tipo: TipoOperacionPppoe;

  origen: OrigenOperacionPppoe;

  canal?: CanalOperacionPppoe;
  iniciadoPorId?: number | null;

  /**
   * Permite sobrescribir la política predeterminada
   * de reautenticación.
   *
   * Si no se proporciona:
   *
   * - CREAR_SECRET requiere reautenticación;
   * - ELIMINAR_SECRET requiere reautenticación;
   * - ACTIVAR_SECRET no la requiere;
   * - SUSPENDER_SERVICIO no la requiere.
   */
  requiereReautenticacion?: boolean;

  motivo?: string | null;

  usuarioPppoeSnapshot: string;

  codigoPerfilSnapshot?: string | null;

  routerHostSnapshot: string;

  routerPuertoSnapshot: number;
};

/**
 * CASO DE USO
 * Crea una operación PPPoE y sus pasos técnicos iniciales.
 *
 * Flujo:
 *
 * 1. Busca una operación con la misma clave de idempotencia.
 * 2. Si existe y corresponde a la misma solicitud, la devuelve.
 * 3. Comprueba que la cuenta no tenga otra operación en curso.
 * 4. Construye PppoeOperacionEntity.
 * 5. Genera la secuencia de pasos según el tipo.
 * 6. Persiste la operación y los pasos mediante nested create.
 */
@Injectable()
export class CrearPppoeOperacionUseCase {
  constructor(
    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly repository: PppoeOperacionRepositoryPort,
  ) {}

  /**
   * Ejecuta la creación idempotente de una operación.
   */
  async execute(
    input: CrearPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAggregate> {
    /**
     * ========================================================
     * 1. IDEMPOTENCIA
     * ========================================================
     */

    const existingOperation = await this.repository.findByIdempotencyKey({
      empresaId: input.empresaId,

      claveIdempotencia: input.claveIdempotencia,
    });

    if (existingOperation) {
      /**
       * Una misma clave únicamente puede representar
       * la misma intención.
       *
       * Si se reutiliza para otra cuenta, router o tipo,
       * se considera un conflicto.
       */
      this.assertCompatibleIdempotentRequest(existingOperation, input);

      const existingOperationId = existingOperation.id;

      if (existingOperationId === null) {
        throw new Error(
          'La operación obtenida por idempotencia no contiene id.',
        );
      }

      const existingAggregate = await this.repository.findAggregateById({
        empresaId: input.empresaId,

        operacionId: existingOperationId,
      });

      if (!existingAggregate) {
        throw new Error(
          `La operación idempotente ${existingOperationId} existe, pero no pudo cargarse como agregado.`,
        );
      }

      /**
       * No se crea una segunda operación.
       *
       * Se devuelve la operación creada en la primera
       * ejecución de la misma solicitud.
       */
      return existingAggregate;
    }

    /**
     * CONCURRENCIA POR CUENTA
     */

    const runningOperation = await this.repository.findRunningOperation({
      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,

      estados: [
        EstadoOperacionPppoe.PENDIENTE,
        EstadoOperacionPppoe.AUTORIZADA,
        EstadoOperacionPppoe.EJECUTANDO,
      ],
    });

    if (runningOperation) {
      throw new ConflictException(
        this.buildRunningOperationMessage(runningOperation),
      );
    }

    /**
     * CONSTRUCCIÓN DE LA ENTIDAD PRINCIPAL
     */

    const operation = PppoeOperacionEntity.create({
      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,

      mikrotikRouterId: input.mikrotikRouterId,

      perfilHomologacionId: input.perfilHomologacionId ?? null,

      instalacionId: input.instalacionId ?? null,

      desinstalacionId: input.desinstalacionId ?? null,

      claveIdempotencia: input.claveIdempotencia,

      tipo: input.tipo,

      origen: input.origen,

      canal: input.canal ?? CanalOperacionPppoe.SSH,

      iniciadoPorId: input.iniciadoPorId ?? null,

      requiereReautenticacion:
        input.requiereReautenticacion ??
        this.resolveDefaultReauthentication(input.tipo),

      motivo: input.motivo ?? null,

      usuarioPppoeSnapshot: input.usuarioPppoeSnapshot,

      codigoPerfilSnapshot: input.codigoPerfilSnapshot ?? null,

      routerHostSnapshot: input.routerHostSnapshot,

      routerPuertoSnapshot: input.routerPuertoSnapshot,
    });

    /**
     *  PLANIFICACIÓN DE PASOS
     */

    const steps = this.buildInitialSteps(input.tipo);

    /**
     *  PERSISTENCIA DEL AGREGADO
     */

    return this.repository.createWithSteps({
      operacion: operation,

      pasos: steps,
    });
  }

  /**
   * PLANIFICACIÓN DE PASOS
   * Construye la secuencia técnica correspondiente
   * a cada tipo de operación.
   *
   * Los órdenes comienzan en 1 y son continuos.
   */
  private buildInitialSteps(
    tipo: TipoOperacionPppoe,
  ): CrearPppoeOperacionPasoInicialProps[] {
    switch (tipo) {
      /**
       * Crear un secret nuevo o confirmar que el existente
       * coincide con la configuración esperada.
       */
      case TipoOperacionPppoe.CREAR_SECRET:
        return this.createSteps([
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.AGREGAR_SECRET,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ]);

      /**
       * Reactivar un secret que ya existe.
       */
      case TipoOperacionPppoe.ACTIVAR_SECRET:
        return this.createSteps([
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.HABILITAR_SECRET,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ]);

      /**
       * Deshabilitar el secret y remover inmediatamente
       * una posible sesión activa.
       */
      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        return this.createSteps([
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.DESHABILITAR_SECRET,

          TipoPasoPppoe.REMOVER_SESION_ACTIVA,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ]);

      /**
       * Retirar definitivamente el secret del router.
       */
      case TipoOperacionPppoe.ELIMINAR_SECRET:
        return this.createSteps([
          TipoPasoPppoe.CONECTAR_ROUTER,

          TipoPasoPppoe.BUSCAR_SECRET,

          TipoPasoPppoe.DESHABILITAR_SECRET,

          TipoPasoPppoe.REMOVER_SESION_ACTIVA,

          TipoPasoPppoe.ELIMINAR_SECRET,

          TipoPasoPppoe.CONFIRMAR_SECRET,
        ]);

      default: {
        const exhaustiveCheck: never = tipo;

        throw new Error(
          `Tipo de operación PPPoE no soportado: ${exhaustiveCheck}.`,
        );
      }
    }
  }

  /**
   * Convierte una lista ordenada de tipos de paso
   * en props listas para createWithSteps().
   */
  private createSteps(
    types: TipoPasoPppoe[],
  ): CrearPppoeOperacionPasoInicialProps[] {
    return types.map((type, index) => ({
      tipo: type,

      orden: index + 1,
    }));
  }

  /**
   * POLÍTICA DE REAUTENTICACIÓN
   *
   * El valor puede ser reemplazado explícitamente
   * mediante input.requiereReautenticacion.
   */
  private resolveDefaultReauthentication(tipo: TipoOperacionPppoe): boolean {
    switch (tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
      case TipoOperacionPppoe.ELIMINAR_SECRET:
        return true;

      case TipoOperacionPppoe.ACTIVAR_SECRET:
      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        return false;

      default: {
        const exhaustiveCheck: never = tipo;

        throw new Error(
          `No existe una política de reautenticación para: ${exhaustiveCheck}.`,
        );
      }
    }
  }

  /**
   * VALIDACIÓN DE IDEMPOTENCIA
   * Comprueba que una clave idempotente existente
   * represente la misma solicitud.
   *
   * también deben
   * coincidir los datos que identifican la intención.
   */
  private assertCompatibleIdempotentRequest(
    existing: PppoeOperacionEntity,
    input: CrearPppoeOperacionUseCaseInput,
  ): void {
    const sameAccount = existing.cuentaPppoeId === input.cuentaPppoeId;

    const sameRouter = existing.mikrotikRouterId === input.mikrotikRouterId;

    const sameType = existing.tipo === input.tipo;

    const sameInstallation =
      existing.instalacionId === (input.instalacionId ?? null);

    const sameUninstallation =
      existing.desinstalacionId === (input.desinstalacionId ?? null);

    if (
      sameAccount &&
      sameRouter &&
      sameType &&
      sameInstallation &&
      sameUninstallation
    ) {
      return;
    }

    throw new ConflictException(
      'La clave de idempotencia ya fue utilizada para una operación PPPoE diferente.',
    );
  }

  /**
   * MENSAJES
   * Construye un mensaje seguro para una operación
   * que bloquea la creación de otro intento.
   */
  private buildRunningOperationMessage(
    operation: PppoeOperacionEntity,
  ): string {
    const operationId =
      operation.id === null ? 'sin persistir' : String(operation.id);

    return (
      `La cuenta PPPoE ${operation.cuentaPppoeId} ` +
      `ya tiene una operación en curso. ` +
      `Operación: ${operationId}; ` +
      `tipo: ${operation.tipo}; ` +
      `estado: ${operation.estado}.`
    );
  }
}
