import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';
import {
  EjecutarOperacionPppoeResult,
  PPPOE_PROVISIONAMIENTO,
  PppoeProvisionamientoPort,
} from 'src/modules/pppoe-automatizacion/public/pppoe-provisionamiento.port';
import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import {
  ClientePppoeCuentaDetalleActivacionAccion,
  FlujoActivacionCuentaPppoe,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import { EstadoOperacionPppoe } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import {
  ClienteInstalacionNoEncontradaError,
  ClienteInstalacionPppoeConflictoError,
} from '../../domain/errors/cliente-instalacion.errors';
import {
  CLIENTE_INSTALACION_REPOSITORY,
  ClienteInstalacionRepositoryPort,
} from '../../domain/ports/cliente-instalacion-repository.port';
import {
  ClienteInstalacionResumen,
  resumirInstalacion,
} from '../../domain/read-models/cliente-instalacion-resumen.read-model';
import {
  REAUTENTICACION_OPERADOR,
  ReautenticacionOperadorPort,
} from '../ports/reautenticacion-operador.port';
import { ResolverPppoeInstalacionService } from '../services/resolver-pppoe-instalacion.service';

export type ActivarPppoeInstalacionInput = {
  instalacionId: number;
  operadorId: number;
  operadorNombre?: string | null;
  ipOrigen?: string | null;
  userAgent?: string | null;
  /** Solo sirve para reautenticar al operador: no entra a operaciones ni auditoría. */
  contrasenaActual: string;
};

export type ActivarPppoeInstalacionResult = {
  instalacion: ClienteInstalacionResumen;
  accesoInternetId: number;
  cuentaPppoeId: number;
  /** Null si el secret ya estaba creado y confirmado. */
  creacion: EjecutarOperacionPppoeResult | null;
  activacion: EjecutarOperacionPppoeResult;
  activadoEn: Date;
};

/**
 * Primera activación PPPoE de la cuenta de una instalación: reautentica al
 * operador, inicia formalmente la instalación si seguía programada, crea o
 * confirma el secret, lo habilita y registra `fechaActivacionServicio`.
 * No arma comandos RouterOS ni abre SSH: eso lo hace el motor PPPoE.
 */
@Injectable()
export class ActivarPppoeInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalaciones: ClienteInstalacionRepositoryPort,

    private readonly resolverPppoe: ResolverPppoeInstalacionService,

    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,

    @Inject(PPPOE_PROVISIONAMIENTO)
    private readonly provisionamiento: PppoeProvisionamientoPort,

    @Inject(REAUTENTICACION_OPERADOR)
    private readonly reautenticacion: ReautenticacionOperadorPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: ActivarPppoeInstalacionInput,
  ): Promise<ActivarPppoeInstalacionResult> {
    await this.reautenticacion.confirmar(
      input.operadorId,
      input.contrasenaActual,
    );

    const encontrada = await this.instalaciones.findById(input.instalacionId);

    if (!encontrada) {
      throw new ClienteInstalacionNoEncontradaError();
    }

    const contexto = await this.resolverPppoe.resolve(encontrada);

    if (!contexto.aplica) {
      throw new ClienteInstalacionPppoeConflictoError(
        'La instalación no contiene un acceso nuevo GPON/PPPoE que pueda activarse.',
      );
    }

    const cuentaPppoeId = contexto.cuenta.id as number;

    // El detalle de la cuenta decide si esta activación le toca a esta
    // instalación: así todos los puntos de entrada comparten la regla.
    const detalleCuenta = await this.cuentasPppoe.obtenerDetalle({
      cuentaPppoeId,
    });

    this.exigirActivacionPermitida(
      detalleCuenta.acciones.activar,
      input.instalacionId,
    );

    // Se persiste antes de tocar el router: si MikroTik falla, la instalación
    // queda EN_PROCESO y la operación se puede reintentar.
    let instalacion = await this.asegurarEnProceso(encontrada);

    const actor = {
      origen: OrigenOperacionPppoe.OPERADOR,
      iniciadoPorId: input.operadorId,
      operadorNombre: input.operadorNombre ?? null,
      ipOrigen: input.ipOrigen ?? null,
      userAgent: input.userAgent ?? null,
    };

    let creacion: EjecutarOperacionPppoeResult | null = null;

    // Si un intento anterior ya confirmó el secret, no se repite CREAR_SECRET.
    if (!contexto.cuenta.tieneSecretCreado) {
      creacion = await this.provisionamiento.crearSecret({
        empresaId: instalacion.empresaId,
        cuentaPppoeId,
        instalacionId: input.instalacionId,
        claveIdempotencia: this.claveIdempotencia(
          input.instalacionId,
          cuentaPppoeId,
          'crear-secret',
        ),
        actor,
        motivo: `Creación o confirmación del secret PPPoE autorizada desde oficina para la instalación ${input.instalacionId}.`,
      });

      this.exigirExito(creacion, 'creación del secret');
    }

    // Clave propia, distinta de la de CREAR_SECRET: idempotencia por operación.
    const activacion = await this.provisionamiento.activarSecret({
      empresaId: instalacion.empresaId,
      cuentaPppoeId,
      instalacionId: input.instalacionId,
      claveIdempotencia: this.claveIdempotencia(
        input.instalacionId,
        cuentaPppoeId,
        'activar-secret',
      ),
      actor,
      motivo: `Activación del servicio PPPoE autorizada desde oficina para la instalación ${input.instalacionId}.`,
    });

    this.exigirExito(activacion, 'activación del secret');

    if (!instalacion.toPrimitives().fechaActivacionServicio) {
      instalacion.marcarServicioActivado(this.reloj.ahora());
      instalacion = await this.instalaciones.save(instalacion);
    }

    const activadoEn = instalacion.toPrimitives().fechaActivacionServicio;

    if (!activadoEn) {
      throw new ClienteInstalacionPppoeConflictoError(
        'El servicio fue activado, pero no fue posible confirmar la fecha de activación local.',
      );
    }

    return {
      instalacion: resumirInstalacion(instalacion),
      accesoInternetId: contexto.accesoInternetId,
      cuentaPppoeId,
      creacion,
      activacion,
      activadoEn,
    };
  }

  private exigirActivacionPermitida(
    accion: ClientePppoeCuentaDetalleActivacionAccion,
    instalacionId: number,
  ): void {
    if (accion.flujo !== FlujoActivacionCuentaPppoe.INSTALACION) {
      throw new ClienteInstalacionPppoeConflictoError(
        'La cuenta PPPoE no pertenece al flujo de instalación.',
      );
    }

    if (accion.instalacionId !== instalacionId) {
      throw new ClienteInstalacionPppoeConflictoError(
        accion.instalacionId === null
          ? 'La cuenta PPPoE no posee una instalación operativa vinculada.'
          : 'La cuenta PPPoE está vinculada a otra instalación.',
      );
    }

    if (!accion.habilitada) {
      throw new ClienteInstalacionPppoeConflictoError(
        accion.motivo ?? 'La cuenta PPPoE no puede activarse actualmente.',
      );
    }
  }

  private exigirExito(
    resultado: EjecutarOperacionPppoeResult,
    nombreOperacion: string,
  ): void {
    if (resultado.estadoOperacion === EstadoOperacionPppoe.EXITOSA) {
      return;
    }

    if (resultado.estadoOperacion === EstadoOperacionPppoe.EJECUTANDO) {
      throw new ClienteInstalacionPppoeConflictoError(
        `La ${nombreOperacion} ya está siendo ejecutada por otra solicitud.`,
      );
    }

    if (
      resultado.estadoOperacion === EstadoOperacionPppoe.FALLIDA ||
      resultado.estadoOperacion === EstadoOperacionPppoe.PARCIAL
    ) {
      throw new ClienteInstalacionPppoeConflictoError(
        resultado.errorMensaje
          ? `Falló la ${nombreOperacion}: ${resultado.errorMensaje}`
          : `La ${nombreOperacion} terminó en estado ${resultado.estadoOperacion}.`,
      );
    }

    throw new ClienteInstalacionPppoeConflictoError(
      `La ${nombreOperacion} quedó en estado ${resultado.estadoOperacion} y no confirmó el resultado esperado.`,
    );
  }

  private claveIdempotencia(
    instalacionId: number,
    cuentaPppoeId: number,
    paso: 'crear-secret' | 'activar-secret',
  ): string {
    return [
      'cliente-instalacion',
      instalacionId,
      'cuenta-pppoe',
      cuentaPppoeId,
      paso,
    ].join(':');
  }

  private async asegurarEnProceso(
    instalacion: ClienteInstalacionEntity,
  ): Promise<ClienteInstalacionEntity> {
    switch (instalacion.estado) {
      case EstadoInstalacionCliente.PROGRAMADA:
      case EstadoInstalacionCliente.REPROGRAMADA:
        instalacion.iniciar({ fechaInicio: this.reloj.ahora() });

        return this.instalaciones.save(instalacion);

      // Repetición idempotente (conserva fechaInicio) o instalación histórica
      // terminada en campo antes de que oficina confirmara PPPoE.
      case EstadoInstalacionCliente.EN_PROCESO:
      case EstadoInstalacionCliente.COMPLETADA:
        return instalacion;

      default:
        throw new ClienteInstalacionPppoeConflictoError(
          `No puede activarse PPPoE mientras la instalación se encuentre en estado ${instalacion.estado}.`,
        );
    }
  }
}
