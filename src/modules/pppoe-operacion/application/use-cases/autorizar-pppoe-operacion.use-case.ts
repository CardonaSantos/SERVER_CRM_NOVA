import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { PppoeOperacionEntity } from '../../domain/entities/pppoe-operacion.entity';
import {
  OPERADOR_REAUTENTICACION,
  OperadorReautenticacionPort,
} from '../ports/operador-reautenticacion.port';
import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionRepositoryPort,
} from '../../domain/ports/pppoe-operacion-repository.port';
import {
  OperacionPppoeDatosInvalidosError,
  OperacionPppoeEstadoInvalidoError,
  OperacionPppoeNoEncontradaError,
  ReautenticacionOperadorInvalidaError,
} from '../../domain/errors/pppoe-operacion.errors';

/**
 * Datos necesarios para autorizar una operación PPPoE
 * mediante la reautenticación del operador.
 */
export type AutorizarPppoeOperacionUseCaseInput = {
  operacionId: number;

  /**
   * Operador autenticado que está confirmando la acción.
   */
  operadorId: number;
  password: string;
};

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
 * 4. Lanza REAUTENTICACION_INVALIDA (403).
 */
@Injectable()
export class AutorizarPppoeOperacionUseCase {
  constructor(
    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly repository: PppoeOperacionRepositoryPort,
    @Inject(OPERADOR_REAUTENTICACION)
    private readonly operadorReautenticacion: OperadorReautenticacionPort,
    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: AutorizarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionEntity> {
    this.assertPositiveInteger(input.operacionId, 'operacionId');
    this.assertPositiveInteger(input.operadorId, 'operadorId');
    this.assertPassword(input.password);

    const operacion = await this.repository.findById({
      operacionId: input.operacionId,
    });

    if (!operacion) {
      throw new OperacionPppoeNoEncontradaError();
    }

    if (!operacion.requiereReautenticacion) {
      throw new OperacionPppoeEstadoInvalidoError(
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
      throw new OperacionPppoeEstadoInvalidoError(
        `La operación PPPoE no puede autorizarse desde el estado ${operacion.estado}.`,
      );
    }

    const fechaReautenticacion = this.reloj.ahora();

    const credencialesValidas = await this.operadorReautenticacion.validar({
      operadorId: input.operadorId,
      /**
       * No utilizar trim.
       */
      password: input.password,
    });

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
      throw new ReautenticacionOperadorInvalidaError();
    }

    operacion.autorizar({
      reautenticadoPorId: input.operadorId,
      fecha: fechaReautenticacion,
    });

    return this.repository.saveOperation(operacion);
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new OperacionPppoeDatosInvalidosError(
        `${field} debe ser un entero positivo.`,
      );
    }
  }

  private assertPassword(password: string): void {
    if (typeof password !== 'string' || password.length === 0) {
      throw new OperacionPppoeDatosInvalidosError(
        'La contraseña del operador es obligatoria.',
      );
    }

    /**
     * Límite defensivo para evitar entradas anormalmente
     * grandes antes de llamar al comparador de hashes.
     */
    if (password.length > 512) {
      throw new OperacionPppoeDatosInvalidosError(
        'La contraseña enviada supera la longitud permitida.',
      );
    }
  }
}
