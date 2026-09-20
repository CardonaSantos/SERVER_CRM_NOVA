import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';

import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';

import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';

import { CompletarClienteInstalacionDto } from '../dto/completar-cliente-instalacion.dto';

export type CompletarInstalacionActor = {
  operadorId: number;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

export type CompletarClienteInstalacionCommand =
  CompletarClienteInstalacionDto & {
    id: number;

    completadoPorId: number;

    operadorId: number;
  };

/**
 * Finaliza el trabajo técnico de una instalación.
 *
 * Esta operación:
 *
 * - cambia EN_PROCESO -> COMPLETADA;
 * - registra quién completó la instalación;
 * - registra fechaFinalizacion;
 * - registra resultado y observaciones cuando correspondan.
 *
 * No realiza ninguna operación PPPoE.
 * No ejecuta SSH.
 * No activa secrets.
 * No modifica fechaActivacionServicio.
 */
@Injectable()
export class CompletarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly clienteInstalacion: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(command: CompletarClienteInstalacionCommand) {
    this.validateCommand(command);

    const instalacion = await this.clienteInstalacion.findById({
      id: command.id,
    });

    if (!instalacion) {
      throw new NotFoundException(
        `No se encontró la instalación ${command.id}.`,
      );
    }

    /**
     * Idempotencia:
     *
     * si una petición se repite después de haber
     * completado correctamente la instalación,
     * devolvemos el estado persistido sin volver
     * a ejecutar ninguna transición.
     */
    if (instalacion.estado === EstadoInstalacionCliente.COMPLETADA) {
      return instalacion;
    }

    this.assertCanComplete(instalacion.estado);

    const fechaFinalizacion = this.parseFechaFinalizacion(
      command.fechaFinalizacion,
    );

    instalacion.completar({
      completadoPorId: command.completadoPorId,

      resultado: command.resultado ?? null,

      observaciones: command.observaciones ?? null,

      fechaFinalizacion,
    });

    return this.clienteInstalacion.save(instalacion);
  }

  private assertCanComplete(estado: EstadoInstalacionCliente): void {
    if (estado === EstadoInstalacionCliente.EN_PROCESO) {
      return;
    }

    throw new ConflictException(
      `No puede completarse la instalación desde el estado ${estado}.`,
    );
  }

  private validateCommand(command: CompletarClienteInstalacionCommand): void {
    this.assertPositiveInteger(command.id, 'id');

    this.assertPositiveInteger(command.operadorId, 'operadorId');

    this.assertPositiveInteger(command.completadoPorId, 'completadoPorId');

    if (command.completadoPorId !== command.operadorId) {
      throw new BadRequestException(
        'completadoPorId debe coincidir con el operador autenticado.',
      );
    }
  }

  private parseFechaFinalizacion(
    value: string | Date | null | undefined,
  ): Date | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const fecha = value instanceof Date ? new Date(value) : new Date(value);

    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException(
        'fechaFinalizacion debe contener una fecha válida.',
      );
    }

    return fecha;
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}

// import {
//   BadRequestException,
//   ConflictException,
//   Inject,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';

// import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';

// import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';

// import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';

// import { CompletarClienteInstalacionDto } from '../dto/completar-cliente-instalacion.dto';

// import {
//   PPPOE_PROVISIONAMIENTO,
//   PppoeProvisionamientoPort,
// } from 'src/modules/pppoe-automatizacion/domain/ports/pppoe-provisionamiento.port';

// import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

// import { EstadoOperacionPppoe } from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

// import { EjecutarOperacionPppoeResult } from 'src/modules/pppoe-automatizacion/domain/props/pppoe-provisionamiento.props';

// import { ResolverPppoeInstalacionService } from '../services/resolver-pppoe-instalacion.service';

// export type CompletarInstalacionActor = {
//   operadorId: number;

//   operadorNombre?: string | null;

//   ipOrigen?: string | null;

//   userAgent?: string | null;
// };

// export type CompletarClienteInstalacionCommand =
//   CompletarClienteInstalacionDto & {
//     id: number;

//     completadoPorId: number;

//     operadorId: number;

//     operadorNombre?: string | null;

//     ipOrigen?: string | null;

//     userAgent?: string | null;
//   };

// /**
//  * Completa una instalación y, cuando se solicita,
//  * activa el servicio asociado.
//  *
//  * Para accesos GPON/PPPoE:
//  *
//  * 1. valida la cuenta PPPoE;
//  * 2. completa localmente la instalación;
//  * 3. habilita el secret en MikroTik;
//  * 4. confirma fechaActivacionServicio.
//  *
//  * No se mantiene una transacción de base de datos
//  * abierta durante la conexión SSH.
//  */
// @Injectable()
// export class CompletarClienteInstalacionUseCase {
//   constructor(
//     @Inject(CLIENTE_INSTALACION_REPOSITORY)
//     private readonly clienteInstalacion: ClienteInstalacionRepositoryPort,

//     private readonly resolverPppoe: ResolverPppoeInstalacionService,

//     @Inject(PPPOE_PROVISIONAMIENTO)
//     private readonly pppoeProvisionamiento: PppoeProvisionamientoPort,
//   ) {}

//   async execute(command: CompletarClienteInstalacionCommand) {
//     this.validateCommand(command);

//     const instalacion = await this.clienteInstalacion.findById({
//       id: command.id,
//     });

//     if (!instalacion) {
//       throw new NotFoundException(
//         `No se encontró la instalación ${command.id}.`,
//       );
//     }

//     this.assertCanCompleteOrResume(instalacion.estado);

//     /*
//      * Solo resolvemos PPPoE cuando el operador solicita
//      * activar el servicio.
//      *
//      * Una instalación puede completarse sin activar.
//      */
//     const contextoPppoe =
//       command.activarServicio === true
//         ? await this.resolverPppoe.resolve(instalacion)
//         : null;

//     const fechaFinalizacion = this.parseFechaFinalizacion(
//       command.fechaFinalizacion,
//     );

//     let instalacionPersistida = instalacion;

//     /*
//      * Primera ejecución:
//      *
//      * EN_PROCESO -> COMPLETADA.
//      *
//      * Una repetición HTTP encuentra la instalación
//      * COMPLETADA y continúa idempotentemente.
//      */
//     if (instalacion.estado === EstadoInstalacionCliente.EN_PROCESO) {
//       instalacion.completar({
//         completadoPorId: command.completadoPorId,

//         resultado: command.resultado ?? null,

//         observaciones: command.observaciones ?? null,

//         fechaFinalizacion,
//       });

//       instalacionPersistida = await this.clienteInstalacion.save(instalacion);
//     }

//     /*
//      * La instalación puede completarse sin solicitar
//      * la activación inmediata del servicio.
//      */
//     if (command.activarServicio !== true) {
//       return instalacionPersistida;
//     }

//     const primitives = instalacionPersistida.toPrimitives();

//     /*
//      * La activación local ya fue confirmada anteriormente.
//      */
//     if (primitives.fechaActivacionServicio) {
//       return instalacionPersistida;
//     }

//     /*
//      * Para tecnologías sin automatización PPPoE,
//      * activarServicio=true representa la confirmación
//      * explícita del operador.
//      */
//     if (!contextoPppoe || !contextoPppoe.aplica) {
//       instalacionPersistida.marcarServicioActivado(
//         this.resolveActivationDate(instalacionPersistida),
//       );

//       return this.clienteInstalacion.save(instalacionPersistida);
//     }

//     const cuentaPppoeId = contextoPppoe.cuenta.id;

//     if (cuentaPppoeId === null) {
//       throw new ConflictException(
//         'La cuenta PPPoE no contiene un identificador persistido.',
//       );
//     }

//     const resultadoPppoe = await this.pppoeProvisionamiento.activarSecret({
//       empresaId: instalacionPersistida.empresaId,

//       cuentaPppoeId,

//       instalacionId: command.id,

//       claveIdempotencia: this.buildIdempotencyKey({
//         instalacionId: command.id,

//         cuentaPppoeId,
//       }),

//       actor: {
//         origen: OrigenOperacionPppoe.OPERADOR,

//         iniciadoPorId: command.operadorId,

//         operadorNombre: command.operadorNombre ?? null,

//         ipOrigen: command.ipOrigen ?? null,

//         userAgent: command.userAgent ?? null,
//       },

//       motivo: `Activación del servicio PPPoE al completar la instalación ${command.id}.`,
//     });

//     this.assertSuccessfulActivation(resultadoPppoe);

//     /*
//      * La operación remota fue confirmada.
//      *
//      * Guardamos por separado la fecha de activación
//      * porque COMPLETADA no implica necesariamente ACTIVA.
//      */
//     instalacionPersistida.marcarServicioActivado(
//       this.resolveActivationDate(instalacionPersistida),
//     );

//     return this.clienteInstalacion.save(instalacionPersistida);
//   }

//   /**
//    * Permite reanudar una solicitud cuando la instalación
//    * ya se guardó como COMPLETADA, pero faltó activar o
//    * persistir fechaActivacionServicio.
//    */
//   private assertCanCompleteOrResume(estado: EstadoInstalacionCliente): void {
//     if (
//       estado === EstadoInstalacionCliente.EN_PROCESO ||
//       estado === EstadoInstalacionCliente.COMPLETADA
//     ) {
//       return;
//     }

//     throw new ConflictException(
//       `No puede completarse la instalación desde el estado ${estado}.`,
//     );
//   }

//   private assertSuccessfulActivation(
//     resultado: EjecutarOperacionPppoeResult,
//   ): void {
//     if (resultado.estadoOperacion === EstadoOperacionPppoe.EXITOSA) {
//       return;
//     }

//     if (resultado.estadoOperacion === EstadoOperacionPppoe.EJECUTANDO) {
//       throw new ConflictException(
//         `La instalación está COMPLETADA, pero la operación PPPoE ${resultado.operacionId} está siendo ejecutada por otra solicitud.`,
//       );
//     }

//     if (
//       resultado.estadoOperacion === EstadoOperacionPppoe.FALLIDA ||
//       resultado.estadoOperacion === EstadoOperacionPppoe.PARCIAL
//     ) {
//       throw new ConflictException(
//         resultado.errorMensaje
//           ? `La instalación quedó COMPLETADA, pero falló la activación PPPoE: ${resultado.errorMensaje}`
//           : `La instalación quedó COMPLETADA, pero la operación PPPoE ${resultado.operacionId} terminó en estado ${resultado.estadoOperacion}.`,
//       );
//     }

//     throw new ConflictException(
//       `La operación PPPoE ${resultado.operacionId} quedó en estado ${resultado.estadoOperacion} y no confirmó la activación del servicio.`,
//     );
//   }

//   private buildIdempotencyKey(params: {
//     instalacionId: number;

//     cuentaPppoeId: number;
//   }): string {
//     return [
//       'cliente-instalacion',
//       params.instalacionId,
//       'cuenta-pppoe',
//       params.cuentaPppoeId,
//       'activar-secret',
//     ].join(':');
//   }

//   private resolveActivationDate(instalacion: {
//     toPrimitives(): {
//       fechaFinalizacion?: Date | null;
//     };
//   }): Date {
//     const fechaFinalizacion = instalacion.toPrimitives().fechaFinalizacion;

//     const ahora = new Date();

//     if (!fechaFinalizacion) {
//       return ahora;
//     }

//     return new Date(
//       Math.max(ahora.getTime(), new Date(fechaFinalizacion).getTime()),
//     );
//   }

//   private validateCommand(command: CompletarClienteInstalacionCommand): void {
//     this.assertPositiveInteger(command.id, 'id');

//     this.assertPositiveInteger(command.operadorId, 'operadorId');

//     this.assertPositiveInteger(command.completadoPorId, 'completadoPorId');

//     if (command.completadoPorId !== command.operadorId) {
//       throw new BadRequestException(
//         'completadoPorId debe coincidir con el operador autenticado.',
//       );
//     }
//   }

//   private parseFechaFinalizacion(
//     value: string | Date | null | undefined,
//   ): Date | undefined {
//     if (value === undefined || value === null) {
//       return undefined;
//     }

//     const fecha = new Date(value);

//     if (Number.isNaN(fecha.getTime())) {
//       throw new BadRequestException(
//         'fechaFinalizacion debe contener una fecha válida.',
//       );
//     }

//     return fecha;
//   }

//   private assertPositiveInteger(value: number, field: string): void {
//     if (!Number.isInteger(value) || value <= 0) {
//       throw new BadRequestException(`${field} debe ser un entero positivo.`);
//     }
//   }
// }
