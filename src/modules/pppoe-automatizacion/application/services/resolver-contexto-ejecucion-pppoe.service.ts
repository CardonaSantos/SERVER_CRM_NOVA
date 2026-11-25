import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PPPOE_SECRET_CIPHER,
  PppoeSecretCipherPort,
} from 'src/modules/pppoe-credentials/public/pppoe-secret-cipher.port';
import {
  PPPOE_PERFIL_HOMOLOGACION,
  PppoePerfilHomologacionFacadePort,
} from 'src/modules/pppoe-perfil-homologacion/public/pppoe-perfil-homologacion.facade.port';
import { ClientePppoeCuentaReadModel } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

import { PerfilHomologacionReadModel } from 'src/modules/pppoe-perfil-homologacion/public/pppoe-perfil-homologacion.types';
/**
 * Ajusta únicamente esta ruta a la ubicación real
 * del token que ya utilizas en el módulo de homologación.
 */

import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';

import { TipoOperacionPppoe } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import { ContextoEjecucionPppoe } from '../models/contexto-ejecucion-pppoe.model';
import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import { MIKROTIK_ROUTER_CONNECTION_CONTEXT } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';
import {
  MikrotikRouterConnectionContext,
  MikrotikRouterConnectionContextPort,
} from 'src/mikro-tik/domain/ports/mikrotik-router-connection-context.port';

@Injectable()
export class ResolverContextoEjecucionPppoeService {
  constructor(
    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,

    @Inject(PPPOE_PERFIL_HOMOLOGACION)
    private readonly perfilesHomologacion: PppoePerfilHomologacionFacadePort,

    @Inject(PPPOE_SECRET_CIPHER)
    private readonly secretCipher: PppoeSecretCipherPort,

    @Inject(MIKROTIK_ROUTER_CONNECTION_CONTEXT)
    private readonly routerContext: MikrotikRouterConnectionContextPort,
  ) {}

  async resolve(
    operacion: PppoeOperacionEntity,
  ): Promise<ContextoEjecucionPppoe> {
    const operacionProps = operacion.toPrimitives();

    if (operacionProps.id === null) {
      throw new ConflictException(
        'La operación PPPoE debe estar persistida antes de resolver su contexto.',
      );
    }

    const cuenta = await this.cuentasPppoe.buscarPorId(operacion.cuentaPppoeId);

    if (!cuenta) {
      throw new NotFoundException(
        `No existe la cuenta PPPoE ${operacion.cuentaPppoeId}.`,
      );
    }

    this.validarCuenta({
      operacion,
      cuenta,
    });

    const perfil = await this.perfilesHomologacion.buscarPorId(
      cuenta.perfilHomologacionId,
    );

    if (!perfil) {
      throw new NotFoundException(
        `No existe la homologación PPPoE ${cuenta.perfilHomologacionId}.`,
      );
    }

    this.validarPerfil({
      operacion,
      cuenta,
      perfil,
    });

    const router = await this.routerContext.resolve(operacion.mikrotikRouterId);

    this.validarRouterSnapshot({
      operacion,
      router,
    });

    /**
     * Solo CREAR_SECRET necesita conocer
     * la contraseña PPPoE.
     *
     * Esto reduce el tiempo y los lugares donde la
     * credencial existe en texto plano.
     */
    const passwordPppoe =
      operacion.tipo === TipoOperacionPppoe.CREAR_SECRET
        ? await this.secretCipher.decrypt(cuenta.secretoProtegido)
        : null;

    return {
      operacion,

      cuenta,

      perfil,

      router,

      passwordPppoe,
    };
  }

  private validarCuenta(params: {
    operacion: PppoeOperacionEntity;

    cuenta: ClientePppoeCuentaReadModel;
  }): void {
    const { operacion, cuenta } = params;

    if (cuenta.empresaId !== operacion.empresaId) {
      throw new ConflictException(
        'La cuenta PPPoE no pertenece a la empresa de la operación.',
      );
    }

    if (cuenta.id !== operacion.cuentaPppoeId) {
      throw new ConflictException(
        'La cuenta PPPoE no coincide con la operación solicitada.',
      );
    }

    if (cuenta.estaEliminada) {
      throw new ConflictException(
        'No puede ejecutarse una operación sobre una cuenta PPPoE eliminada.',
      );
    }

    if (
      operacion.perfilHomologacionId !== null &&
      operacion.perfilHomologacionId !== cuenta.perfilHomologacionId
    ) {
      throw new ConflictException(
        'La homologación de la operación no coincide con la cuenta PPPoE.',
      );
    }
  }

  private validarPerfil(params: {
    operacion: PppoeOperacionEntity;

    cuenta: ClientePppoeCuentaReadModel;

    perfil: PerfilHomologacionReadModel;
  }): void {
    const { operacion, cuenta, perfil } = params;

    const perfilProps = perfil;

    if (perfilProps.empresaId !== operacion.empresaId) {
      throw new ConflictException(
        'La homologación PPPoE no pertenece a la empresa de la operación.',
      );
    }

    if (perfilProps.id !== cuenta.perfilHomologacionId) {
      throw new ConflictException(
        'La homologación recuperada no coincide con la cuenta PPPoE.',
      );
    }

    if (perfilProps.mikrotikRouterId !== operacion.mikrotikRouterId) {
      throw new ConflictException(
        'La homologación PPPoE pertenece a un router diferente al indicado en la operación.',
      );
    }

    /**
     * Crear y activar necesitan una homologación vigente.
     *
     * Suspender no debe bloquearse porque un perfil haya
     * sido desactivado administrativamente: todavía debemos
     * poder cortar el servicio existente.
     */
    const requierePerfilActivo = [
      TipoOperacionPppoe.CREAR_SECRET,
      TipoOperacionPppoe.ACTIVAR_SECRET,
    ].includes(operacion.tipo);

    if (requierePerfilActivo && !perfilProps.activo) {
      throw new ConflictException('La homologación PPPoE está inactiva.');
    }
  }

  private validarRouterSnapshot(params: {
    operacion: PppoeOperacionEntity;

    router: MikrotikRouterConnectionContext;
  }): void {
    const { operacion, router } = params;

    const props = operacion.toPrimitives();

    if (
      props.routerHostSnapshot === null ||
      props.routerPuertoSnapshot === null
    ) {
      throw new ConflictException(
        'La operación PPPoE no contiene el snapshot del router.',
      );
    }

    const hostActual = router.host.trim().toLowerCase();

    const hostSnapshot = props.routerHostSnapshot.trim().toLowerCase();

    if (
      hostActual !== hostSnapshot ||
      router.port !== props.routerPuertoSnapshot
    ) {
      throw new ConflictException(
        'La configuración actual del router no coincide con el snapshot de la operación. Debe generarse una operación nueva con el contexto actualizado.',
      );
    }
  }
}
