import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';

import {
  PPPOE_PROVISIONAMIENTO,
  PppoeProvisionamientoPort,
} from 'src/modules/pppoe-automatizacion/domain/ports/pppoe-provisionamiento.port';
import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { ClienteDesinstalacionAutorizacionEntity } from '../../domain/entities/cliente-desintalacion-autorizacion.entitie';
import { ClienteDesinstalacionAutorizacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion-autorizacion.repository.port';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import {
  CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY,
  CLIENTE_DESINSTALACION_REPOSITORY,
} from '../../infra/tokens/cliente-desinstalacion.token';
import { AprobarDesinstalacionAutorizacionDto } from '../dto/autorizacion-desinstalacion.dto';
import { ValidarAccesoDesinstalacionService } from '../services/validar-acceso-desinstalacion.service';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

export type AprobarAutorizacionDesinstalacionCommand =
  AprobarDesinstalacionAutorizacionDto & {
    id: number;

    autorizadoPorId: number;
  };

export type AprobarAutorizacionDesinstalacionResult = {
  autorizacion: ClienteDesinstalacionAutorizacionEntity;

  desinstalacion: ClienteDesinstalacionEntity;
};

@Injectable()
export class AprobarAutorizacionDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY)
    private readonly autorizacionRepository: ClienteDesinstalacionAutorizacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalacionRepository: ClienteDesInstalacionRepositoryPort,

    private readonly validarAccesoDesinstalacionService: ValidarAccesoDesinstalacionService,

    private readonly authService: AuthService,

    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaPppoeRepository: ClientePppoeCuentaRepositoryPort,

    @Inject(PPPOE_PROVISIONAMIENTO)
    private readonly pppoeProvisionamiento: PppoeProvisionamientoPort,
  ) {}

  async execute(
    command: AprobarAutorizacionDesinstalacionCommand,
  ): Promise<AprobarAutorizacionDesinstalacionResult> {
    /**
     * ========================================================
     * 1. AUTORIZACIÓN
     * ========================================================
     */

    const autorizacion = await this.autorizacionRepository.findById(command.id);

    if (!autorizacion) {
      throw new NotFoundException('Autorización no encontrada.');
    }

    if (!autorizacion.isPendiente) {
      throw new ConflictException('La autorización ya fue respondida.');
    }

    /**
     * ========================================================
     * 2. DESINSTALACIÓN
     * ========================================================
     */

    const desinstalacion = await this.desinstalacionRepository.findById(
      autorizacion.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    if (desinstalacion.isFinalizada) {
      throw new ConflictException(
        'No se puede aprobar una autorización de una desinstalación finalizada.',
      );
    }

    if (!desinstalacion.isProgramada) {
      throw new ConflictException(
        `Solo una desinstalación PROGRAMADA puede autorizarse. Estado actual: ${desinstalacion.estado}.`,
      );
    }

    const props = desinstalacion.toPrimitives();

    /**
     * ========================================================
     * 3. ACCESO A DESINSTALAR
     * ========================================================
     *
     * Estado 5 requiere conocer exactamente el acceso
     * relacionado para resolver su cuenta PPPoE.
     */

    if (
      props.accesoInternetId === null ||
      props.accesoInternetId === undefined
    ) {
      throw new ConflictException(
        'La desinstalación no tiene un acceso de internet asociado.',
      );
    }

    const acceso = await this.validarAccesoDesinstalacionService.validar({
      clienteId: props.clienteId,

      accesoInternetId: props.accesoInternetId,
    });

    /**
     * Defensa adicional para registros históricos o
     * inconsistentes.
     */
    if (props.empresaId !== acceso.empresaId) {
      throw new ConflictException(
        'El acceso seleccionado no pertenece a la empresa de la desinstalación.',
      );
    }

    /**
     * ========================================================
     * 4. CUENTA PPPoE
     * ========================================================
     */

    const cuentaPppoe = await this.cuentaPppoeRepository.findByAccesoInternetId(
      props.accesoInternetId,
    );

    if (!cuentaPppoe) {
      throw new ConflictException(
        `El acceso de internet ${props.accesoInternetId} no tiene una cuenta PPPoE asociada.`,
      );
    }

    if (cuentaPppoe.id === null) {
      throw new ConflictException(
        'La cuenta PPPoE asociada no contiene un identificador persistido.',
      );
    }

    if (cuentaPppoe.empresaId !== acceso.empresaId) {
      throw new ConflictException(
        'La cuenta PPPoE no pertenece a la empresa del acceso seleccionado.',
      );
    }

    /**
     * ========================================================
     * 5. VALIDACIÓN DE SEGURIDAD
     * ========================================================
     *
     * Estado 5 - Paso A.
     *
     * La contraseña nunca se almacena. Únicamente se utiliza
     * para confirmar que el operador autenticado autoriza
     * personalmente la baja definitiva.
     */

    await this.authService.reautenticarUsuarioPorId(
      command.autorizadoPorId,

      command.contrasenaActual,
    );
    /**
     * ========================================================
     * 6. APROBACIÓN ADMINISTRATIVA
     * ========================================================
     */

    try {
      autorizacion.aprobar({
        autorizadoPorId: command.autorizadoPorId,

        comentarioAutorizador: command.comentarioAutorizador ?? null,
      });

      /**
       * Valida que la desinstalación pueda
       * ser autorizada.
       *
       * No cambia todavía su estado.
       */
      desinstalacion.autorizar();
    } catch (error) {
      throw new ConflictException(
        error instanceof Error
          ? error.message
          : 'No se pudo aprobar la autorización.',
      );
    }

    const savedAutorizacion =
      await this.autorizacionRepository.save(autorizacion);

    /**
     * No guardamos nuevamente la desinstalación porque
     * autorizar() actualmente no modifica sus propiedades.
     *
     * La evidencia administrativa de la aprobación queda
     * en ClienteDesinstalacionAutorizacion:
     *
     * - estado APROBADA
     * - autorizadoPorId
     * - fechaRespuesta
     * - comentarioAutorizador
     */

    /**
     * ========================================================
     * 7. INICIO DE LA DESINSTALACIÓN
     * ========================================================
     *
     * La autorización aprobada comienza la ejecución
     * efectiva de la baja.
     *
     * Si la operación PPPoE falla posteriormente,
     * la desinstalación permanece EN_PROCESO y nunca
     * se registra como completada incorrectamente.
     */

    try {
      desinstalacion.iniciar({
        ejecutadoPorId: command.autorizadoPorId,

        fechaInicio: new Date(),
      });
    } catch (error) {
      throw new ConflictException(
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar la desinstalación.',
      );
    }

    await this.desinstalacionRepository.save(desinstalacion);

    /**
     * ========================================================
     * 8. BAJA DEFINITIVA PPPoE
     * ========================================================
     */

    const resultadoPppoe = await this.pppoeProvisionamiento.eliminarSecret({
      empresaId: acceso.empresaId,

      cuentaPppoeId: cuentaPppoe.id,

      desinstalacionId: autorizacion.desinstalacionId,

      instalacionId: null,

      claveIdempotencia: `desinstalacion:${autorizacion.desinstalacionId}:eliminar-secret:v1`,

      motivo:
        props.motivo !== null
          ? `Desinstalación ${autorizacion.desinstalacionId} autorizada por motivo ${props.motivo}.`
          : `Eliminación definitiva del acceso PPPoE durante la desinstalación ${autorizacion.desinstalacionId}.`,

      actor: {
        origen: OrigenOperacionPppoe.OPERADOR,

        iniciadoPorId: command.autorizadoPorId,
      },
    });

    /**
     * ========================================================
     * 9. CONFIRMACIÓN DEL RESULTADO PPPoE
     * ========================================================
     *
     * No se completa la desinstalación si la cuenta
     * no terminó efectivamente en ELIMINADA.
     */

    if (resultadoPppoe.estadoCuenta !== EstadoCuentaPppoe.ELIMINADA) {
      throw new ConflictException(
        `La baja PPPoE no terminó con la cuenta ELIMINADA. Estado resultante: ${resultadoPppoe.estadoCuenta}.`,
      );
    }

    /**
     * ========================================================
     * 10. COMPLETAR DESINSTALACIÓN
     * ========================================================
     *
     * La baja PPPoE ya fue confirmada.
     */

    try {
      desinstalacion.completar({
        ejecutadoPorId: command.autorizadoPorId,

        fechaFinalizacion: new Date(),

        resultado: `Baja PPPoE confirmada. Operación PPPoE ${resultadoPppoe.operacionId}.`,

        /**
         * No afirmamos recuperación física
         * de equipo solamente por haber eliminado
         * el acceso PPPoE.
         */
        equipoRecuperado: false,

        conforme: null,
      });
    } catch (error) {
      throw new ConflictException(
        error instanceof Error
          ? error.message
          : 'La baja PPPoE fue realizada, pero no pudo completarse la desinstalación.',
      );
    }

    const savedDesinstalacion =
      await this.desinstalacionRepository.save(desinstalacion);

    return {
      autorizacion: savedAutorizacion,

      desinstalacion: savedDesinstalacion,
    };
  }
}
