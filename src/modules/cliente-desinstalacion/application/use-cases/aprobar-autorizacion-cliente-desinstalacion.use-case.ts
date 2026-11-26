import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';
import {
  PPPOE_PROVISIONAMIENTO,
  PppoeProvisionamientoPort,
} from 'src/modules/pppoe-automatizacion/public/pppoe-provisionamiento.port';
import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import {
  AutorizacionDesinstalacionConflictoError,
  AutorizacionDesinstalacionNoEncontradaError,
  ClienteDesinstalacionNoEncontradaError,
  ClienteDesinstalacionPppoeConflictoError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY,
  ClienteDesinstalacionAutorizacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-autorizacion-repository.port';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  AutorizacionDesinstalacionResumen,
  ClienteDesinstalacionResumen,
  resumirAutorizacion,
  resumirDesinstalacion,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';
import {
  REAUTENTICACION_OPERADOR,
  ReautenticacionOperadorPort,
} from '../ports/reautenticacion-operador.port';
import { ValidarAccesoDesinstalacionService } from '../services/validar-acceso-desinstalacion.service';

export type AprobarAutorizacionDesinstalacionInput = {
  id: number;
  autorizadoPorId: number;
  /** Solo sirve para reautenticar a quien autoriza la baja definitiva; no se guarda. */
  contrasenaActual: string;
  comentarioAutorizador?: string | null;
};

export type AprobarAutorizacionDesinstalacionResult = {
  autorizacion: AutorizacionDesinstalacionResumen;
  desinstalacion: ClienteDesinstalacionResumen;
};

/**
 * Aprueba la baja: reautentica, deja la autorización APROBADA y la
 * desinstalación EN_PROCESO (juntas, en una transacción), elimina el secret
 * PPPoE en el router y, si la cuenta quedó ELIMINADA, completa la
 * desinstalación. Si el router falla, queda EN_PROCESO y la operación PPPoE se
 * recupera desde su propio flujo; nunca se completa de más.
 */
@Injectable()
export class AprobarAutorizacionDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY)
    private readonly autorizaciones: ClienteDesinstalacionAutorizacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    private readonly validarAcceso: ValidarAccesoDesinstalacionService,

    @Inject(REAUTENTICACION_OPERADOR)
    private readonly reautenticacion: ReautenticacionOperadorPort,

    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,

    @Inject(PPPOE_PROVISIONAMIENTO)
    private readonly pppoe: PppoeProvisionamientoPort,

    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: AprobarAutorizacionDesinstalacionInput,
  ): Promise<AprobarAutorizacionDesinstalacionResult> {
    const autorizacion = await this.autorizaciones.findById(input.id);

    if (!autorizacion) {
      throw new AutorizacionDesinstalacionNoEncontradaError();
    }

    if (!autorizacion.isPendiente) {
      throw new AutorizacionDesinstalacionConflictoError(
        'La autorización ya fue respondida.',
      );
    }

    const desinstalacion = await this.desinstalaciones.findById(
      autorizacion.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    if (desinstalacion.isFinalizada) {
      throw new AutorizacionDesinstalacionConflictoError(
        'No se puede aprobar una autorización de una desinstalación finalizada.',
      );
    }

    const props = desinstalacion.toPrimitives();

    if (
      props.accesoInternetId === null ||
      props.accesoInternetId === undefined
    ) {
      throw new ClienteDesinstalacionPppoeConflictoError(
        'La desinstalación no tiene un acceso de internet asociado.',
      );
    }

    await this.validarAcceso.validar({
      clienteId: props.clienteId,
      accesoInternetId: props.accesoInternetId,
    });

    const cuentaPppoe = await this.cuentasPppoe.buscarPorAccesoInternet(
      props.accesoInternetId,
    );

    if (!cuentaPppoe || cuentaPppoe.id === null) {
      throw new ClienteDesinstalacionPppoeConflictoError(
        'El acceso de internet no tiene una cuenta PPPoE asociada.',
      );
    }

    // La contraseña solo confirma que quien autoriza es quien dice ser.
    await this.reautenticacion.confirmar(
      input.autorizadoPorId,
      input.contrasenaActual,
    );

    const ahora = this.reloj.ahora();

    // Aprobar e iniciar van juntos; antes de tocar el router.
    await this.unidad.ejecutar(async () => {
      autorizacion.aprobar({
        autorizadoPorId: input.autorizadoPorId,
        comentarioAutorizador: input.comentarioAutorizador ?? null,
        fechaRespuesta: ahora,
      });
      desinstalacion.autorizar();
      desinstalacion.iniciar({
        ejecutadoPorId: input.autorizadoPorId,
        fechaInicio: ahora,
      });

      await this.autorizaciones.save(autorizacion);
      await this.desinstalaciones.save(desinstalacion);
    });

    const baja = await this.pppoe.eliminarSecret({
      empresaId: props.empresaId,
      cuentaPppoeId: cuentaPppoe.id,
      desinstalacionId: autorizacion.desinstalacionId,
      instalacionId: null,
      claveIdempotencia: `desinstalacion:${autorizacion.desinstalacionId}:eliminar-secret:v1`,
      motivo:
        props.motivo !== null && props.motivo !== undefined
          ? `Desinstalación ${autorizacion.desinstalacionId} autorizada por motivo ${props.motivo}.`
          : `Eliminación definitiva del acceso PPPoE durante la desinstalación ${autorizacion.desinstalacionId}.`,
      actor: {
        origen: OrigenOperacionPppoe.OPERADOR,
        iniciadoPorId: input.autorizadoPorId,
      },
    });

    // No se completa si la cuenta no terminó efectivamente ELIMINADA.
    if (baja.estadoCuenta !== EstadoCuentaPppoe.ELIMINADA) {
      throw new ClienteDesinstalacionPppoeConflictoError(
        'La baja PPPoE no terminó con la cuenta eliminada.',
      );
    }

    desinstalacion.completar({
      ejecutadoPorId: input.autorizadoPorId,
      fechaFinalizacion: this.reloj.ahora(),
      resultado: `Baja PPPoE confirmada. Operación PPPoE ${baja.operacionId}.`,
      // Eliminar el acceso PPPoE no prueba que el equipo se haya recuperado.
      equipoRecuperado: false,
      conforme: null,
    });

    const completada = await this.desinstalaciones.save(desinstalacion);

    return {
      autorizacion: resumirAutorizacion(autorizacion),
      desinstalacion: resumirDesinstalacion(completada),
    };
  }
}
