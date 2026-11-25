import { Inject, Injectable } from '@nestjs/common';
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
import { TipoOperacionPppoe } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';
import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import { MIKROTIK_ROUTER_CONNECTION_CONTEXT } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';
import {
  MikrotikRouterConnectionContext,
  MikrotikRouterConnectionContextPort,
} from 'src/mikro-tik/domain/ports/mikrotik-router-connection-context.port';
import { PppoeOperacionReadModel } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';
import { ProvisionamientoPppoeEstadoInvalidoError } from '../../domain/errors/pppoe-automatizacion.errors';
import { CuentaPppoeNoEncontradaError } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import { PerfilHomologacionNoEncontradoError } from 'src/modules/pppoe-perfil-homologacion/public/pppoe-perfil-homologacion.types';

/**
 * Ajusta únicamente esta ruta a la ubicación real
 * del token que ya utilizas en el módulo de homologación.
 */

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
    operacion: PppoeOperacionReadModel,
  ): Promise<ContextoEjecucionPppoe> {
    const operacionProps = operacion;

    if (operacionProps.id === null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La operación PPPoE debe estar persistida antes de resolver su contexto.',
      );
    }

    const cuenta = await this.cuentasPppoe.buscarPorId(operacion.cuentaPppoeId);

    if (!cuenta) {
      throw new CuentaPppoeNoEncontradaError();
    }

    this.validarCuenta({
      operacion,
      cuenta,
    });

    const perfil = await this.perfilesHomologacion.buscarPorId(
      cuenta.perfilHomologacionId,
    );

    if (!perfil) {
      throw new PerfilHomologacionNoEncontradoError();
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
    operacion: PppoeOperacionReadModel;

    cuenta: ClientePppoeCuentaReadModel;
  }): void {
    const { operacion, cuenta } = params;

    if (cuenta.empresaId !== operacion.empresaId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no pertenece a la empresa de la operación.',
      );
    }

    if (cuenta.id !== operacion.cuentaPppoeId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no coincide con la operación solicitada.',
      );
    }

    if (cuenta.estaEliminada) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'No puede ejecutarse una operación sobre una cuenta PPPoE eliminada.',
      );
    }

    if (
      operacion.perfilHomologacionId !== null &&
      operacion.perfilHomologacionId !== cuenta.perfilHomologacionId
    ) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La homologación de la operación no coincide con la cuenta PPPoE.',
      );
    }
  }

  private validarPerfil(params: {
    operacion: PppoeOperacionReadModel;

    cuenta: ClientePppoeCuentaReadModel;

    perfil: PerfilHomologacionReadModel;
  }): void {
    const { operacion, cuenta, perfil } = params;

    const perfilProps = perfil;

    if (perfilProps.empresaId !== operacion.empresaId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La homologación PPPoE no pertenece a la empresa de la operación.',
      );
    }

    if (perfilProps.id !== cuenta.perfilHomologacionId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La homologación recuperada no coincide con la cuenta PPPoE.',
      );
    }

    if (perfilProps.mikrotikRouterId !== operacion.mikrotikRouterId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
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
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La homologación PPPoE está inactiva.',
      );
    }
  }

  private validarRouterSnapshot(params: {
    operacion: PppoeOperacionReadModel;

    router: MikrotikRouterConnectionContext;
  }): void {
    const { operacion, router } = params;

    const props = operacion;

    if (
      props.routerHostSnapshot === null ||
      props.routerPuertoSnapshot === null
    ) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La operación PPPoE no contiene el snapshot del router.',
      );
    }

    const hostActual = router.host.trim().toLowerCase();

    const hostSnapshot = props.routerHostSnapshot.trim().toLowerCase();

    if (
      hostActual !== hostSnapshot ||
      router.port !== props.routerPuertoSnapshot
    ) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La configuración actual del router no coincide con el snapshot de la operación. Debe generarse una operación nueva con el contexto actualizado.',
      );
    }
  }
}

/**
 * Contexto técnico interno utilizado durante una
 * ejecución PPPoE.
 *
 * Puede contener credenciales temporalmente descifradas,
 * por lo que nunca debe:
 *
 * - devolverse desde un controller;
 * - persistirse;
 * - registrarse en logs;
 * - almacenarse en auditorías;
 * - serializarse.
 */
export type ContextoEjecucionPppoe = {
  operacion: PppoeOperacionReadModel;

  cuenta: ClientePppoeCuentaReadModel;

  perfil: PerfilHomologacionReadModel;

  router: MikrotikRouterConnectionContext;

  /**
   * Solo se descifra para CREAR_SECRET.
   *
   * Activación, suspensión y eliminación no necesitan
   * conocer la contraseña PPPoE.
   */
  passwordPppoe: string | null;
};
