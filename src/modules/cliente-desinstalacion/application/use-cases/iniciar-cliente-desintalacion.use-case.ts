import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { dayjs } from 'src/Utils/dayjs.config';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';
import { IniciarClienteDesinstalacionDto } from '../dto/iniciar-cliente-desinstalacion.dto';
import { ValidarAccesoDesinstalacionService } from '../services/validar-acceso-desinstalacion.service';

import { ValidarAutorizacionDesinstalacionService } from '../services/validar-autorizacion-desinstalacion.service';
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

export type IniciarClienteDesinstalacionCommand =
  IniciarClienteDesinstalacionDto & {
    id: number;
    ejecutadoPorId: number;
  };

@Injectable()
export class IniciarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,

    private readonly validarAutorizacionDesinstalacionService: ValidarAutorizacionDesinstalacionService,

    private readonly validarAccesoDesinstalacionService: ValidarAccesoDesinstalacionService,

    private readonly authService: AuthService,

    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaPppoeRepository: ClientePppoeCuentaRepositoryPort,

    @Inject(PPPOE_PROVISIONAMIENTO)
    private readonly pppoeProvisionamiento: PppoeProvisionamientoPort,
  ) {}

  async execute(
    command: IniciarClienteDesinstalacionCommand,
  ): Promise<ClienteDesinstalacionEntity> {
    const desinstalacion = await this.clienteDesinstalacionRepository.findById(
      command.id,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    const esInicioNuevo = desinstalacion.isProgramada;

    const esReanudacion = desinstalacion.isEnProceso;

    if (!esInicioNuevo && !esReanudacion) {
      throw new ConflictException(
        `La desinstalación no puede iniciar ni reanudar la eliminación PPPoE desde el estado ${desinstalacion.estado}.`,
      );
    }

    await this.validarAutorizacionDesinstalacionService.exigirAprobada(
      command.id,
    );

    const props = desinstalacion.toPrimitives();

    let cuentaPppoeId: number | null = null;

    if (
      props.accesoInternetId !== null &&
      props.accesoInternetId !== undefined
    ) {
      await this.validarAccesoDesinstalacionService.validar({
        empresaId: props.empresaId,
        clienteId: props.clienteId,
        servicioInternetId: props.servicioInternetId ?? null,
        accesoInternetId: props.accesoInternetId,
      });

      const cuentaPppoe =
        await this.cuentaPppoeRepository.findByAccesoInternetId(
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

      if (cuentaPppoe.empresaId !== props.empresaId) {
        throw new ConflictException(
          'La cuenta PPPoE no pertenece a la empresa de la desinstalación.',
        );
      }

      cuentaPppoeId = cuentaPppoe.id;
    }

    await this.authService.reautenticarUsuarioPorId(
      command.ejecutadoPorId,
      command.contrasenaActual,
    );

    let desinstalacionGuardada = desinstalacion;

    if (esInicioNuevo) {
      desinstalacion.iniciar({
        ejecutadoPorId: command.ejecutadoPorId,

        fechaInicio: command.fechaInicio
          ? dayjs(command.fechaInicio).toDate()
          : undefined,
      });

      desinstalacionGuardada =
        await this.clienteDesinstalacionRepository.save(desinstalacion);
    }

    if (cuentaPppoeId !== null) {
      await this.pppoeProvisionamiento.eliminarSecret({
        empresaId: props.empresaId,

        cuentaPppoeId,

        desinstalacionId: command.id,

        instalacionId: null,

        claveIdempotencia: `desinstalacion:${command.id}:eliminar-secret:v1`,

        motivo:
          props.motivo !== null
            ? `Desinstalación ${command.id} por motivo ${props.motivo}.`
            : `Eliminación definitiva del secret PPPoE durante la desinstalación ${command.id}.`,

        actor: {
          origen: OrigenOperacionPppoe.OPERADOR,

          iniciadoPorId: command.ejecutadoPorId,
        },
      });
    }

    return desinstalacionGuardada;
  }
}
