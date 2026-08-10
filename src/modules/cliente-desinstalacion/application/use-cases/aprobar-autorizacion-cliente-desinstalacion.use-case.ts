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
     *
     * Una vez confirmada la identidad del operador podemos
     * persistir quién autorizó la baja y cuándo.
     */

    try {
      autorizacion.aprobar({
        autorizadoPorId: command.autorizadoPorId,

        comentarioAutorizador: command.comentarioAutorizador ?? null,
      });

      /**
       * Actualmente autorizar() valida la transición de
       * negocio pero mantiene la desinstalación PROGRAMADA.
       *
       * El estado EN_PROCESO queda reservado para cuando
       * el técnico inicie el retiro físico.
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
     * 7. ESTADO 5 - BAJA DEFINITIVA PPPoE
     * ========================================================
     *
     * El módulo PPPoE es responsable de:
     *
     * /ppp secret remove [find name="..."]
     * /ppp active remove [find name="..."]
     *
     * además de operación, pasos, idempotencia y auditoría.
     */

    await this.pppoeProvisionamiento.eliminarSecret({
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

    return {
      autorizacion: savedAutorizacion,

      desinstalacion,
    };
  }
}
