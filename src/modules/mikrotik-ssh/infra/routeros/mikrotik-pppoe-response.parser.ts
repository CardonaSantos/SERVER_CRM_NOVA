import { Injectable } from '@nestjs/common';

import {
  CodigoErrorMikrotikSsh,
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
} from '../../domain/enums/mikrotik-ssh.enums';

import { MikrotikSshError } from '../../domain/errors/mikrotik-ssh.error';

import {
  BuscarSecretMikrotikParams,
  ConfirmarSecretMikrotikParams,
  CrearSecretMikrotikParams,
  GestionarSecretMikrotikParams,
  RemoverSesionActivaMikrotikParams,
} from '../../domain/props/mikrotik-ssh-secret.props';

import {
  BuscarSecretMikrotikResult,
  ConfirmarSecretMikrotikResult,
  CrearSecretMikrotikResult,
  GestionarSecretMikrotikResult,
} from '../../domain/results/mikrotik-ssh-secret.result';

import { SesionActivaMikrotikSnapshot } from '../../domain/results/mikrotik-ssh-common.result';

import { ResultadoEjecucionComandoMikrotikSsh } from '../ssh/types/mikrotik-ssh-command.types';

import {
  BuscarSesionesActivasRouterOsResult,
  RemoverSesionesActivasRouterOsResult,
} from './types/routeros-response-parser.types';

type AccionGestionSecretMikrotik = 'HABILITAR' | 'DESHABILITAR' | 'ELIMINAR';

/**
 * Convierte respuestas técnicas de RouterOS
 * en resultados semánticos del módulo.
 */
@Injectable()
export class MikrotikPppoeResponseParser {
  parseBuscarSecret(
    execution: ResultadoEjecucionComandoMikrotikSsh,
    params: BuscarSecretMikrotikParams,
  ): BuscarSecretMikrotikResult {
    this.assertCommandAccepted(
      execution,
      FaseFalloMikrotikSsh.EJECUCION,
      EfectoRemotoMikrotik.NO_INICIADO,
    );

    const lines = this.normalizeLines(execution.stdout);

    if (lines.includes('CRM_SECRET_NOT_FOUND')) {
      return {
        usuarioPppoe: params.usuarioPppoe,

        encontrado: false,

        secret: null,

        duracionMs: execution.duracionMs,

        comandoSanitizado: execution.comandoSanitizado,

        respuestaSanitizada: 'No se encontró el secret PPPoE.',
      };
    }

    if (!lines.includes('CRM_SECRET_FOUND')) {
      this.throwInvalidResponse(
        'RouterOS no devolvió el marcador esperado para la búsqueda del secret.',
        execution,
        FaseFalloMikrotikSsh.EJECUCION,
        EfectoRemotoMikrotik.NO_INICIADO,
      );
    }

    const usuario = this.readRequiredValue(lines, 'CRM_NAME=', execution);

    if (usuario !== params.usuarioPppoe) {
      this.throwInvalidResponse(
        'RouterOS devolvió un usuario diferente al solicitado.',
        execution,
        FaseFalloMikrotikSsh.EJECUCION,
        EfectoRemotoMikrotik.NO_INICIADO,
      );
    }

    const codigoPerfil = this.readOptionalValue(
      lines,
      'CRM_PROFILE=',
      execution,
    );

    const disabledValue = this.readRequiredValue(
      lines,
      'CRM_DISABLED=',
      execution,
    );

    const service = this.readOptionalValue(lines, 'CRM_SERVICE=', execution);

    const deshabilitado = this.parseBoolean(disabledValue, execution);

    return {
      usuarioPppoe: params.usuarioPppoe,

      encontrado: true,

      secret: {
        usuarioPppoe: params.usuarioPppoe,

        codigoPerfil,

        deshabilitado,

        servicio: service,

        /**
         * No se consulta el comentario durante esta fase.
         */
        comentario: null,
      },

      duracionMs: execution.duracionMs,

      comandoSanitizado: execution.comandoSanitizado,

      respuestaSanitizada: `Secret encontrado con perfil ${
        codigoPerfil ?? 'sin perfil'
      } y estado ${deshabilitado ? 'deshabilitado' : 'habilitado'}.`,
    };
  }

  parseCrearSecret(
    execution: ResultadoEjecucionComandoMikrotikSsh,
    params: CrearSecretMikrotikParams,
  ): CrearSecretMikrotikResult {
    this.assertMutationSucceeded(execution);

    return {
      usuarioPppoe: params.usuarioPppoe,

      codigoPerfil: params.codigoPerfil,

      comandoEjecutado: true,

      duracionMs: execution.duracionMs,

      comandoSanitizado: execution.comandoSanitizado,

      respuestaSanitizada: 'RouterOS aceptó el comando de creación del secret.',
    };
  }

  parseGestionSecret(
    execution: ResultadoEjecucionComandoMikrotikSsh,
    params: GestionarSecretMikrotikParams,
    accion: AccionGestionSecretMikrotik,
  ): GestionarSecretMikrotikResult {
    this.assertMutationSucceeded(execution);

    return {
      usuarioPppoe: params.usuarioPppoe,

      accion,

      comandoEjecutado: true,

      duracionMs: execution.duracionMs,

      comandoSanitizado: execution.comandoSanitizado,

      respuestaSanitizada: this.buildMutationMessage(accion),
    };
  }

  parseBuscarSesionesActivas(
    execution: ResultadoEjecucionComandoMikrotikSsh,
    params: RemoverSesionActivaMikrotikParams,
  ): BuscarSesionesActivasRouterOsResult {
    this.assertCommandAccepted(
      execution,
      FaseFalloMikrotikSsh.EJECUCION,
      EfectoRemotoMikrotik.NO_INICIADO,
    );

    const lines = this.normalizeLines(execution.stdout);

    const totalValue = this.readRequiredValue(
      lines,
      'CRM_ACTIVE_COUNT=',
      execution,
    );

    const total = this.parseNonNegativeInteger(totalValue, execution);

    const blocks = this.extractBlocks(
      lines,
      'CRM_ACTIVE_BEGIN',
      'CRM_ACTIVE_END',
      execution,
    );

    if (blocks.length !== total) {
      this.throwInvalidResponse(
        'La cantidad de sesiones PPPoE no coincide con los registros recibidos.',
        execution,
        FaseFalloMikrotikSsh.EJECUCION,
        EfectoRemotoMikrotik.NO_INICIADO,
      );
    }

    const sesiones = blocks.map((block): SesionActivaMikrotikSnapshot => {
      const usuario = this.readRequiredValue(
        block,
        'CRM_ACTIVE_NAME=',
        execution,
      );

      if (usuario !== params.usuarioPppoe) {
        this.throwInvalidResponse(
          'RouterOS devolvió una sesión de otro usuario PPPoE.',
          execution,
          FaseFalloMikrotikSsh.EJECUCION,
          EfectoRemotoMikrotik.NO_INICIADO,
        );
      }

      return {
        usuarioPppoe: params.usuarioPppoe,

        direccionIp: this.readOptionalValue(
          block,
          'CRM_ACTIVE_ADDRESS=',
          execution,
        ),

        tiempoActivo: this.readOptionalValue(
          block,
          'CRM_ACTIVE_UPTIME=',
          execution,
        ),
      };
    });

    return {
      usuarioPppoe: params.usuarioPppoe,

      sesiones,

      duracionMs: execution.duracionMs,

      comandoSanitizado: execution.comandoSanitizado,

      respuestaSanitizada:
        total === 0
          ? 'No se encontraron sesiones PPPoE activas.'
          : `Se encontraron ${total} sesiones PPPoE activas.`,
    };
  }

  parseRemoverSesionesActivas(
    execution: ResultadoEjecucionComandoMikrotikSsh,
    params: RemoverSesionActivaMikrotikParams,
  ): RemoverSesionesActivasRouterOsResult {
    this.assertCommandAccepted(
      execution,
      FaseFalloMikrotikSsh.EJECUCION,
      EfectoRemotoMikrotik.POSIBLE,
    );

    const lines = this.normalizeLines(execution.stdout);

    const totalValue = this.readRequiredValue(lines, 'CRM_REMOVED=', execution);

    const total = this.parseNonNegativeInteger(totalValue, execution);

    return {
      usuarioPppoe: params.usuarioPppoe,

      sesionesRemovidasReportadas: total,

      duracionMs: execution.duracionMs,

      comandoSanitizado: execution.comandoSanitizado,

      respuestaSanitizada:
        total === 0
          ? 'No había sesiones PPPoE activas para remover.'
          : `RouterOS procesó la remoción de ${total} sesiones PPPoE.`,
    };
  }

  confirmarSecret(
    busqueda: BuscarSecretMikrotikResult,
    params: ConfirmarSecretMikrotikParams,
  ): ConfirmarSecretMikrotikResult {
    if (!params.debeExistir) {
      if (busqueda.encontrado) {
        this.throwConfirmationError(
          CodigoErrorMikrotikSsh.ESTADO_SECRET_NO_CONFIRMADO,

          'El secret PPPoE todavía existe después de solicitar su eliminación.',

          busqueda.duracionMs,
        );
      }

      return {
        usuarioPppoe: params.usuarioPppoe,

        confirmado: true,

        debeExistir: false,

        secretActual: null,

        duracionMs: busqueda.duracionMs,

        comandoSanitizado: busqueda.comandoSanitizado,

        respuestaSanitizada: 'Se confirmó que el secret PPPoE no existe.',
      };
    }

    if (!busqueda.encontrado || !busqueda.secret) {
      this.throwConfirmationError(
        CodigoErrorMikrotikSsh.ESTADO_SECRET_NO_CONFIRMADO,

        'No se encontró el secret PPPoE esperado durante la confirmación.',

        busqueda.duracionMs,
      );
    }

    if (
      params.codigoPerfilEsperado !== undefined &&
      params.codigoPerfilEsperado !== null &&
      busqueda.secret.codigoPerfil !== params.codigoPerfilEsperado
    ) {
      this.throwConfirmationError(
        CodigoErrorMikrotikSsh.PERFIL_NO_COINCIDE,

        `El secret utiliza el perfil ${
          busqueda.secret.codigoPerfil ?? 'sin perfil'
        } y se esperaba ${params.codigoPerfilEsperado}.`,

        busqueda.duracionMs,
      );
    }

    if (
      params.deshabilitadoEsperado !== undefined &&
      params.deshabilitadoEsperado !== null &&
      busqueda.secret.deshabilitado !== params.deshabilitadoEsperado
    ) {
      this.throwConfirmationError(
        CodigoErrorMikrotikSsh.ESTADO_SECRET_NO_CONFIRMADO,

        params.deshabilitadoEsperado
          ? 'El secret PPPoE no quedó deshabilitado.'
          : 'El secret PPPoE no quedó habilitado.',

        busqueda.duracionMs,
      );
    }

    return {
      usuarioPppoe: params.usuarioPppoe,

      confirmado: true,

      debeExistir: true,

      secretActual: busqueda.secret,

      duracionMs: busqueda.duracionMs,

      comandoSanitizado: busqueda.comandoSanitizado,

      respuestaSanitizada: 'El estado final del secret PPPoE fue confirmado.',
    };
  }

  private assertMutationSucceeded(
    execution: ResultadoEjecucionComandoMikrotikSsh,
  ): void {
    this.assertCommandAccepted(
      execution,
      FaseFalloMikrotikSsh.EJECUCION,
      EfectoRemotoMikrotik.POSIBLE,
    );

    const lines = this.normalizeLines(execution.stdout);

    if (!lines.includes('CRM_OK')) {
      this.throwInvalidResponse(
        'RouterOS no confirmó la ejecución del comando modificador.',
        execution,
        FaseFalloMikrotikSsh.EJECUCION,
        EfectoRemotoMikrotik.POSIBLE,
      );
    }
  }

  private assertCommandAccepted(
    execution: ResultadoEjecucionComandoMikrotikSsh,
    fase: FaseFalloMikrotikSsh,
    efectoRemoto: EfectoRemotoMikrotik,
  ): void {
    const combinedOutput = [execution.stdout, execution.stderr].join('\n');

    if (combinedOutput.includes('CRM_SECRET_YA_EXISTE')) {
      throw new MikrotikSshError('El secret PPPoE ya existe en el router.', {
        codigo: CodigoErrorMikrotikSsh.SECRET_YA_EXISTE,

        fase,

        efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

        reintentable: false,

        duracionMs: execution.duracionMs,
      });
    }

    if (combinedOutput.includes('CRM_SECRET_NO_ENCONTRADO')) {
      throw new MikrotikSshError('No se encontró el secret PPPoE solicitado.', {
        codigo: CodigoErrorMikrotikSsh.SECRET_NO_ENCONTRADO,

        fase,

        efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

        reintentable: false,

        duracionMs: execution.duracionMs,
      });
    }

    if (combinedOutput.includes('CRM_SECRET_DUPLICADO')) {
      throw new MikrotikSshError(
        'El router contiene más de un secret con el mismo usuario PPPoE.',
        {
          codigo: CodigoErrorMikrotikSsh.RESPUESTA_INVALIDA,

          fase,

          efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

          reintentable: false,

          duracionMs: execution.duracionMs,
        },
      );
    }

    const commandRejected =
      (execution.exitCode !== null && execution.exitCode !== 0) ||
      execution.signal !== null ||
      execution.stderr.trim().length > 0;

    if (commandRejected) {
      throw new MikrotikSshError(
        'RouterOS rechazó o no completó el comando SSH.',
        {
          codigo: CodigoErrorMikrotikSsh.COMANDO_RECHAZADO,

          fase,

          efectoRemoto,

          reintentable: false,

          duracionMs: execution.duracionMs,
        },
      );
    }
  }

  private normalizeLines(value: string): string[] {
    return value
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  private readRequiredValue(
    lines: string[],
    prefix: string,
    execution: ResultadoEjecucionComandoMikrotikSsh,
  ): string {
    const matches = lines.filter((line) => line.startsWith(prefix));

    if (matches.length !== 1) {
      this.throwInvalidResponse(
        `La respuesta no contiene exactamente un valor ${prefix}.`,
        execution,
        FaseFalloMikrotikSsh.EJECUCION,
        EfectoRemotoMikrotik.NO_INICIADO,
      );
    }

    return matches[0].slice(prefix.length);
  }

  private readOptionalValue(
    lines: string[],
    prefix: string,
    execution: ResultadoEjecucionComandoMikrotikSsh,
  ): string | null {
    const value = this.readRequiredValue(lines, prefix, execution);

    return value.length > 0 ? value : null;
  }

  private parseBoolean(
    value: string,
    execution: ResultadoEjecucionComandoMikrotikSsh,
  ): boolean {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true' || normalized === 'yes' || normalized === '1') {
      return true;
    }

    if (normalized === 'false' || normalized === 'no' || normalized === '0') {
      return false;
    }

    this.throwInvalidResponse(
      `RouterOS devolvió un valor booleano inválido: ${value}.`,
      execution,
      FaseFalloMikrotikSsh.EJECUCION,
      EfectoRemotoMikrotik.NO_INICIADO,
    );
  }

  private parseNonNegativeInteger(
    value: string,
    execution: ResultadoEjecucionComandoMikrotikSsh,
  ): number {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 0) {
      this.throwInvalidResponse(
        `RouterOS devolvió una cantidad inválida: ${value}.`,
        execution,
        FaseFalloMikrotikSsh.EJECUCION,
        EfectoRemotoMikrotik.NO_INICIADO,
      );
    }

    return parsed;
  }

  private extractBlocks(
    lines: string[],
    beginMarker: string,
    endMarker: string,
    execution: ResultadoEjecucionComandoMikrotikSsh,
  ): string[][] {
    const blocks: string[][] = [];

    let current: string[] | null = null;

    for (const line of lines) {
      if (line === beginMarker) {
        if (current !== null) {
          this.throwInvalidResponse(
            'La respuesta contiene bloques de sesión anidados.',
            execution,
            FaseFalloMikrotikSsh.EJECUCION,
            EfectoRemotoMikrotik.NO_INICIADO,
          );
        }

        current = [];

        continue;
      }

      if (line === endMarker) {
        if (current === null) {
          this.throwInvalidResponse(
            'La respuesta contiene un cierre de bloque inesperado.',
            execution,
            FaseFalloMikrotikSsh.EJECUCION,
            EfectoRemotoMikrotik.NO_INICIADO,
          );
        }

        blocks.push(current);

        current = null;

        continue;
      }

      if (current !== null) {
        current.push(line);
      }
    }

    if (current !== null) {
      this.throwInvalidResponse(
        'La respuesta contiene un bloque de sesión incompleto.',
        execution,
        FaseFalloMikrotikSsh.EJECUCION,
        EfectoRemotoMikrotik.NO_INICIADO,
      );
    }

    return blocks;
  }

  private buildMutationMessage(accion: AccionGestionSecretMikrotik): string {
    switch (accion) {
      case 'HABILITAR':
        return 'RouterOS aceptó el comando para habilitar el secret.';

      case 'DESHABILITAR':
        return 'RouterOS aceptó el comando para deshabilitar el secret.';

      case 'ELIMINAR':
        return 'RouterOS aceptó el comando para eliminar el secret.';
    }
  }

  private throwConfirmationError(
    codigo: CodigoErrorMikrotikSsh,
    message: string,
    duracionMs: number,
  ): never {
    throw new MikrotikSshError(message, {
      codigo,

      fase: FaseFalloMikrotikSsh.CONFIRMACION,

      efectoRemoto: EfectoRemotoMikrotik.POSIBLE,

      reintentable: true,

      duracionMs,
    });
  }

  private throwInvalidResponse(
    message: string,
    execution: ResultadoEjecucionComandoMikrotikSsh,
    fase: FaseFalloMikrotikSsh,
    efectoRemoto: EfectoRemotoMikrotik,
  ): never {
    throw new MikrotikSshError(message, {
      codigo: CodigoErrorMikrotikSsh.RESPUESTA_INVALIDA,

      fase,

      efectoRemoto,

      reintentable: true,

      duracionMs: execution.duracionMs,
    });
  }
}
