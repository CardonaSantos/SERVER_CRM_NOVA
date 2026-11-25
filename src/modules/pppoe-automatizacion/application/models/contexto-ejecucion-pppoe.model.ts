import { ClientePppoeCuentaReadModel } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

import { PerfilHomologacionReadModel } from 'src/modules/pppoe-perfil-homologacion/public/pppoe-perfil-homologacion.types';

import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';
import { MikrotikRouterConnectionContext } from 'src/mikro-tik/domain/ports/mikrotik-router-connection-context.port';

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
  operacion: PppoeOperacionEntity;

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
