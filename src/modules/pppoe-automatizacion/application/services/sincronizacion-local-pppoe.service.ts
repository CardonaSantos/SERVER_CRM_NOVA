import { Inject, Injectable } from '@nestjs/common';

import {
  CLIENTE,
  ClienteFacadePort,
} from 'src/modules/cliente/public/cliente.facade.port';
import { EstadoOperativoCliente } from 'src/modules/cliente/public/cliente.types';
import {
  PPPOE_ACCESO_INTERNET,
  PppoeAccesoInternetFacadePort,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import { AccesoInternetReadModel } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import {
  ClientePppoeCuentaReadModel,
  EstadoCuentaPppoe,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import {
  PppoeOperacionReadModel,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import { ContextoEliminacionPppoe } from '../../domain/enums/contexto-eliminacion-pppoe.enum';
import { ProvisionamientoPppoeEstadoInvalidoError } from '../../domain/errors/pppoe-automatizacion.errors';
import { resolverContextoEliminacion } from '../../domain/policies/contexto-eliminacion-pppoe.policy';

const { CREAR_SECRET, ACTIVAR_SECRET, SUSPENDER_SERVICIO, ELIMINAR_SECRET } =
  TipoOperacionPppoe;

/**
 * Estado local (cuenta, acceso y cliente) alrededor de una operación PPPoE:
 * qué se prepara antes de tocar el router y qué se aplica cuando el router
 * confirmó el resultado. Lo usan la ejecución y la recuperación.
 */
@Injectable()
export class SincronizacionLocalPppoeService {
  constructor(
    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentas: PppoeClienteCuentaFacadePort,
    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesos: PppoeAccesoInternetFacadePort,
    @Inject(CLIENTE)
    private readonly clientes: ClienteFacadePort,
  ) {}

  /** Deja la cuenta en el estado "en curso" de la operación (o la valida). */
  prepararCuenta(
    operacion: PppoeOperacionReadModel,
    cuenta: ClientePppoeCuentaReadModel,
  ): Promise<ClientePppoeCuentaReadModel> {
    switch (operacion.tipo) {
      case CREAR_SECRET:
        return this.prepararCreacion(cuenta);
      case ACTIVAR_SECRET:
        return this.prepararActivacion(cuenta);
      case SUSPENDER_SERVICIO:
        return Promise.resolve(this.validarSuspension(cuenta));
      case ELIMINAR_SECRET:
        // aquí solo se exige un origen coherente antes de tocar nada.
        if (
          resolverContextoEliminacion(operacion) ===
          ContextoEliminacionPppoe.CONTEXTO_INVALIDO
        ) {
          throw new ProvisionamientoPppoeEstadoInvalidoError(
            'La eliminación PPPoE no puede originarse solo en una instalación.',
          );
        }
        return this.prepararEliminacion(cuenta);
      default:
        return sinSoporte(operacion);
    }
  }

  /** Solo CREAR_SECRET mueve el acceso antes del router (a CONFIGURANDO). */
  prepararAcceso(
    operacion: PppoeOperacionReadModel,
    acceso: AccesoInternetReadModel,
  ): Promise<AccesoInternetReadModel> {
    if (operacion.tipo === CREAR_SECRET) {
      return this.accesos.cambiarEstado({
        accesoInternetId: acceso.id,
        transicion: 'INICIAR_CONFIGURACION',
      });
    }
    return Promise.resolve(acceso);
  }

  /**
   * Aplica en orden a cuenta, acceso y cliente el resultado que el router ya
   * confirmó. Idempotente, para que la recuperación lo pueda repetir. Sin
   * `acceso`, lo busca por la cuenta.
   */
  async confirmarResultado(
    operacion: PppoeOperacionReadModel,
    cuenta: ClientePppoeCuentaReadModel,
    fecha: Date,
    acceso?: AccesoInternetReadModel,
  ): Promise<{
    cuenta: ClientePppoeCuentaReadModel;
    acceso: AccesoInternetReadModel;
  }> {
    const actual =
      acceso ?? (await this.accesos.buscarPorId(cuenta.accesoInternetId));
    if (!actual) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'No existe el acceso de internet asociado a la cuenta PPPoE.',
      );
    }
    const cuentaFinal = await this.confirmarEnCuenta(operacion, cuenta, fecha);
    const accesoFinal = await this.confirmarEnAcceso(operacion, actual, fecha);
    await this.confirmarEnCliente(operacion, accesoFinal);
    return { cuenta: cuentaFinal, acceso: accesoFinal };
  }

  /**
   * Aplica a la cuenta el resultado que el router ya confirmó. Idempotente:
   * si la cuenta ya quedó en el estado final la devuelve sin cambios, así la
   * recuperación puede repetirlo sin riesgo.
   */
  private confirmarEnCuenta(
    operacion: PppoeOperacionReadModel,
    cuenta: ClientePppoeCuentaReadModel,
    fecha: Date,
  ): Promise<ClientePppoeCuentaReadModel> {
    const E = EstadoCuentaPppoe;
    const marcar = (
      yaAplicado: boolean,
      desde: EstadoCuentaPppoe[],
      transicion:
        | 'MARCAR_SECRET_CREADO'
        | 'MARCAR_ACTIVA'
        | 'MARCAR_SUSPENDIDA'
        | 'MARCAR_ELIMINADA',
    ) => {
      // Primero la transición: una cuenta EN_INSTALACION puede tener ya
      // secretCreadoEn (reintento) y aun así debe avanzar.
      if (desde.includes(cuenta.estado)) {
        return this.cuentas.cambiarEstado({
          cuentaPppoeId: cuenta.id,
          transicion,
          fecha,
        });
      }
      if (yaAplicado) return Promise.resolve(cuenta);
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        `No puede confirmarse ${operacion.tipo} con la cuenta en estado ${cuenta.estado}.`,
      );
    };

    switch (operacion.tipo) {
      case CREAR_SECRET:
        return marcar(
          cuenta.tieneSecretCreado,
          [E.EN_INSTALACION],
          'MARCAR_SECRET_CREADO',
        );
      case ACTIVAR_SECRET:
        return marcar(cuenta.estaActiva, [E.EN_ACTIVACION], 'MARCAR_ACTIVA');
      case SUSPENDER_SERVICIO:
        return marcar(
          cuenta.estaSuspendida,
          [E.ACTIVA, E.ERROR],
          'MARCAR_SUSPENDIDA',
        );
      case ELIMINAR_SECRET:
        return marcar(
          cuenta.estaEliminada,
          [E.EN_DESINSTALACION],
          'MARCAR_ELIMINADA',
        );
      default:
        return sinSoporte(operacion);
    }
  }

  /**
   * CREAR_SECRET deja el acceso CONFIGURANDO: el secret existe, pero el
   * servicio no es ACTIVO hasta que ACTIVAR_SECRET lo confirme.
   */
  private confirmarEnAcceso(
    operacion: PppoeOperacionReadModel,
    acceso: AccesoInternetReadModel,
    fecha: Date,
  ): Promise<AccesoInternetReadModel> {
    const transicion = {
      [CREAR_SECRET]: null,
      [ACTIVAR_SECRET]: 'ACTIVAR',
      [SUSPENDER_SERVICIO]: 'SUSPENDER',
      [ELIMINAR_SECRET]: 'DAR_DE_BAJA',
    }[operacion.tipo] as 'ACTIVAR' | 'SUSPENDER' | 'DAR_DE_BAJA' | null;

    if (transicion === undefined) return sinSoporte(operacion);
    if (transicion === null) return Promise.resolve(acceso);
    return this.accesos.cambiarEstado({
      accesoInternetId: acceso.id,
      transicion,
      fecha,
    });
  }

  /**
   * Estado operativo del cliente (nunca el de cobranza). Solo activar y
   * suspender lo cambian: una baja PPPoE no completa por sí sola una
   * desinstalación.
   */
  private async confirmarEnCliente(
    operacion: PppoeOperacionReadModel,
    acceso: AccesoInternetReadModel,
  ): Promise<void> {
    const estado =
      operacion.tipo === ACTIVAR_SECRET
        ? EstadoOperativoCliente.ACTIVO
        : operacion.tipo === SUSPENDER_SERVICIO
          ? EstadoOperativoCliente.SUSPENDIDO
          : null;
    if (!estado) return;

    await this.clientes.sincronizarEstadoOperativo({
      empresaId: acceso.empresaId,
      clienteId: acceso.clienteId,
      estado,
      cambiadoPorId: operacion.iniciadoPorId,
      motivo: operacion.motivo,
      descripcion: `Estado operativo sincronizado automáticamente después de confirmar la operación PPPoE ${operacion.id} ${operacion.tipo}.`,
    });
  }

  /** PENDIENTE_ACTIVACION o ERROR (reintento) → EN_INSTALACION. */
  private prepararCreacion(
    cuenta: ClientePppoeCuentaReadModel,
  ): Promise<ClientePppoeCuentaReadModel> {
    switch (cuenta.estado) {
      case EstadoCuentaPppoe.PENDIENTE_ACTIVACION:
        return this.transicion(cuenta, 'INICIAR_INSTALACION');
      case EstadoCuentaPppoe.ERROR:
        return this.transicion(cuenta, 'REINTENTAR_INSTALACION');
      case EstadoCuentaPppoe.EN_INSTALACION:
        return Promise.resolve(cuenta);
      default:
        throw estadoNoAdmitido(CREAR_SECRET, cuenta);
    }
  }

  /**
   * EN_INSTALACION o SUSPENDIDA (o ERROR al reintentar) → EN_ACTIVACION. El
   * enable se repite aunque el secret ya haya quedado habilitado al crearlo:
   * es el comando de la transición formal a ACTIVO.
   */
  private prepararActivacion(
    cuenta: ClientePppoeCuentaReadModel,
  ): Promise<ClientePppoeCuentaReadModel> {
    switch (cuenta.estado) {
      case EstadoCuentaPppoe.EN_INSTALACION:
      case EstadoCuentaPppoe.SUSPENDIDA:
        return this.transicion(cuenta, 'INICIAR_ACTIVACION');
      case EstadoCuentaPppoe.ERROR:
        return this.transicion(cuenta, 'REINTENTAR_ACTIVACION');
      case EstadoCuentaPppoe.EN_ACTIVACION:
        return Promise.resolve(cuenta);
      default:
        throw estadoNoAdmitido(ACTIVAR_SECRET, cuenta);
    }
  }

  /**
   * No hay estado intermedio de suspensión en la cuenta: solo se valida.
   * Una cuenta adoptada no conoce su fecha de activación, pero se verificó
   * contra el router al adoptarla. ERROR se admite para reintentos.
   */
  private validarSuspension(
    cuenta: ClientePppoeCuentaReadModel,
  ): ClientePppoeCuentaReadModel {
    if (!cuenta.tieneSecretCreado) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'No puede suspenderse una cuenta cuyo secret no está confirmado como existente.',
      );
    }
    if (cuenta.activadoEn === null && !cuenta.esAdoptada) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'No puede suspenderse una cuenta que no tiene una activación confirmada.',
      );
    }
    if (
      cuenta.estado !== EstadoCuentaPppoe.ACTIVA &&
      cuenta.estado !== EstadoCuentaPppoe.ERROR
    ) {
      throw estadoNoAdmitido(SUSPENDER_SERVICIO, cuenta);
    }
    return cuenta;
  }

  /** Cualquier estado vigente → EN_DESINSTALACION. */
  private prepararEliminacion(
    cuenta: ClientePppoeCuentaReadModel,
  ): Promise<ClientePppoeCuentaReadModel> {
    switch (cuenta.estado) {
      case EstadoCuentaPppoe.PENDIENTE_ACTIVACION:
      case EstadoCuentaPppoe.EN_INSTALACION:
      case EstadoCuentaPppoe.EN_ACTIVACION:
      case EstadoCuentaPppoe.ACTIVA:
      case EstadoCuentaPppoe.SUSPENDIDA:
      case EstadoCuentaPppoe.ERROR:
        return this.transicion(cuenta, 'INICIAR_DESINSTALACION');
      case EstadoCuentaPppoe.EN_DESINSTALACION:
        return Promise.resolve(cuenta);
      case EstadoCuentaPppoe.ELIMINADA:
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          'La cuenta PPPoE ya se encuentra eliminada.',
        );
      default:
        throw estadoNoAdmitido(ELIMINAR_SECRET, cuenta);
    }
  }

  private transicion(
    cuenta: ClientePppoeCuentaReadModel,
    transicion:
      | 'INICIAR_INSTALACION'
      | 'REINTENTAR_INSTALACION'
      | 'INICIAR_ACTIVACION'
      | 'REINTENTAR_ACTIVACION'
      | 'INICIAR_DESINSTALACION',
  ): Promise<ClientePppoeCuentaReadModel> {
    return this.cuentas.cambiarEstado({ cuentaPppoeId: cuenta.id, transicion });
  }
}

function estadoNoAdmitido(
  tipo: TipoOperacionPppoe,
  cuenta: ClientePppoeCuentaReadModel,
): ProvisionamientoPppoeEstadoInvalidoError {
  return new ProvisionamientoPppoeEstadoInvalidoError(
    `No puede ejecutarse ${tipo} con la cuenta en estado ${cuenta.estado}.`,
  );
}

function sinSoporte(operacion: PppoeOperacionReadModel): never {
  throw new ProvisionamientoPppoeEstadoInvalidoError(
    `La operación ${operacion.tipo} no está soportada por el motor PPPoE.`,
  );
}
