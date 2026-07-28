import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PppoeOperacionEntity } from '../../domain/entities/pppoe-operacion.entity';
import {
  OPERADOR_REAUTENTICACION_PORT,
  OperadorReautenticacionPort,
} from '../../domain/ports/operador-reautenticacion.port';
import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionRepositoryPort,
} from '../../domain/ports/pppoe-operacion-repository.port';

/**
 * INPUT
 */

/**
 * Datos necesarios para autorizar una operación PPPoE
 * mediante la reautenticación del operador.
 */
export type AutorizarPppoeOperacionUseCaseInput = {
  empresaId: number;
  operacionId: number;

  /**
   * Operador autenticado que está confirmando la acción.
   */
  operadorId: number;
  password: string;
};

/**
 * CASO DE USO
 */

/**
 * Autoriza una operación PPPoE protegida mediante
 * reautenticación.
 *
 * Flujo exitoso:
 *
 * 1. Busca la operación.
 * 2. Comprueba que requiere reautenticación.
 * 3. Comprueba que se encuentra PENDIENTE.
 * 4. Valida las credenciales del operador.
 * 5. Ejecuta operacion.autorizar().
 * 6. Persiste la entidad actualizada.
 *
 * Flujo fallido:
 *
 * 1. Valida las credenciales.
 * 2. Ejecuta registrarReautenticacionFallida().
 * 3. Persiste el intento fallido.
 * 4. Devuelve UnauthorizedException.
 */
@Injectable()
export class AutorizarPppoeOperacionUseCase {
  constructor(
    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly repository: PppoeOperacionRepositoryPort,

    @Inject(OPERADOR_REAUTENTICACION_PORT)
    private readonly operadorReautenticacion: OperadorReautenticacionPort,
  ) {}

  async execute(
    input: AutorizarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionEntity> {
    /**
     *  VALIDACIÓN DE ENTRADA
     */

    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.operacionId, 'operacionId');

    this.assertPositiveInteger(input.operadorId, 'operadorId');

    this.assertPassword(input.password);

    /**
     *  OBTENER OPERACIÓN
     */

    const operacion = await this.repository.findById({
      empresaId: input.empresaId,

      operacionId: input.operacionId,
    });

    if (!operacion) {
      throw new NotFoundException(
        `No existe la operación PPPoE ${input.operacionId} en la empresa ${input.empresaId}.`,
      );
    }

    /**
     *  VALIDAR POLÍTICA DE AUTORIZACIÓN
     */

    if (!operacion.requiereReautenticacion) {
      throw new ConflictException(
        'La operación PPPoE no requiere reautenticación.',
      );
    }

    /**
     * Una solicitud repetida después de una autorización
     * exitosa se considera idempotente.
     *
     * No vuelve a validar ni vuelve a modificar la entidad.
     */
    if (operacion.estaAutorizada()) {
      return operacion;
    }

    if (!operacion.estaPendiente()) {
      throw new ConflictException(
        `La operación PPPoE no puede autorizarse desde el estado ${operacion.estado}.`,
      );
    }

    /**
     *  VALIDAR CREDENCIALES
     */

    const fechaReautenticacion = new Date();

    const credencialesValidas = await this.operadorReautenticacion.validar({
      empresaId: input.empresaId,

      operadorId: input.operadorId,

      /**
       * No utilizar trim.
       */
      password: input.password,
    });

    /**
     * REAUTENTICACIÓN FALLIDA
     */

    if (!credencialesValidas) {
      operacion.registrarReautenticacionFallida({
        reautenticadoPorId: input.operadorId,

        fecha: fechaReautenticacion,
      });

      /**
       * Se guarda el intento fallido antes de devolver
       * el error de autorización.
       */
      await this.repository.saveOperation(operacion);

      /**
       * No revela si:
       * - el usuario no existe;
       * - está inactivo;
       * - pertenece a otra empresa;
       * - la contraseña es incorrecta.
       */
      throw new UnauthorizedException(
        'No fue posible validar las credenciales del operador.',
      );
    }

    /**
     * AUTORIZAR OPERACIÓN
     */

    operacion.autorizar({
      reautenticadoPorId: input.operadorId,

      fecha: fechaReautenticacion,
    });

    /**
     * PERSISTIR OPERACIÓN AUTORIZADA
     */

    return this.repository.saveOperation(operacion);
  }

  /**
   * VALIDACIONES INTERNAS
   */

  /**
   * Valida identificadores enteros positivos.
   */
  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }

  /**
   * Valida únicamente que la contraseña haya sido enviada.
   *
   * No se aplica trim porque los espacios pueden formar
   * parte legítima de una contraseña.
   */
  private assertPassword(password: string): void {
    if (typeof password !== 'string' || password.length === 0) {
      throw new BadRequestException(
        'La contraseña del operador es obligatoria.',
      );
    }

    /**
     * Límite defensivo para evitar entradas anormalmente
     * grandes antes de llamar al comparador de hashes.
     */
    if (password.length > 512) {
      throw new BadRequestException(
        'La contraseña enviada supera la longitud permitida.',
      );
    }
  }
}
