import { Injectable } from '@nestjs/common';

import {
  BuscarSecretMikrotikParams,
  CrearSecretMikrotikParams,
  GestionarSecretMikrotikParams,
  RemoverSesionActivaMikrotikParams,
} from '../../domain/props/mikrotik-ssh-secret.props';

import { ComandoRouterOsConstruido } from './types/routeros-command.types';

import { RouterOsValueEscaper } from './routeros-value-escaper';

type AccionSecretRouterOs = 'enable' | 'disable' | 'remove';

/**
 * Construye únicamente los comandos RouterOS admitidos
 * por el módulo de automatización PPPoE.
 */
@Injectable()
export class MikrotikPppoeCommandBuilder {
  private static readonly MAX_USUARIO_BYTES = 255;

  private static readonly MAX_PASSWORD_BYTES = 512;

  private static readonly MAX_PERFIL_BYTES = 255;

  private static readonly MAX_COMENTARIO_BYTES = 255;

  constructor(private readonly escaper: RouterOsValueEscaper) {}

  construirBuscarSecret(
    params: BuscarSecretMikrotikParams,
  ): ComandoRouterOsConstruido {
    const usuario = this.escapeUsername(params.usuarioPppoe);

    const selector = [
      '/ppp secret print',
      'as-value',
      'proplist=name,profile,disabled,service',
      `where name=${usuario}`,
    ].join(' ');

    const selectorSanitizado = [
      '/ppp secret print',
      'as-value',
      'proplist=name,profile,disabled,service',
      'where name="<usuario>"',
    ].join(' ');

    const command = [
      `:local rows [${selector}];`,

      ':local total [:len $rows];',

      ':if ($total = 0) do={',

      ':put "CRM_SECRET_NOT_FOUND";',

      '} else={',

      ':if ($total > 1) do={',

      ':error "CRM_SECRET_DUPLICADO";',

      '};',

      ':local row [:pick $rows 0];',

      ':put "CRM_SECRET_FOUND";',

      ':put ("CRM_NAME=" . ($row->"name"));',

      ':put ("CRM_PROFILE=" . ($row->"profile"));',

      ':put ("CRM_DISABLED=" . ($row->"disabled"));',

      ':put ("CRM_SERVICE=" . ($row->"service"));',

      '};',
    ].join(' ');

    const sanitizedCommand = [
      `:local rows [${selectorSanitizado}];`,

      ':local total [:len $rows];',

      ':if ($total = 0) do={',

      ':put "CRM_SECRET_NOT_FOUND";',

      '} else={',

      ':if ($total > 1) do={',

      ':error "CRM_SECRET_DUPLICADO";',

      '};',

      ':local row [:pick $rows 0];',

      ':put "CRM_SECRET_FOUND";',

      ':put ("CRM_NAME=<usuario>");',

      ':put ("CRM_PROFILE=" . ($row->"profile"));',

      ':put ("CRM_DISABLED=" . ($row->"disabled"));',

      ':put ("CRM_SERVICE=" . ($row->"service"));',

      '};',
    ].join(' ');

    return this.createResult(command, sanitizedCommand);
  }

  construirCrearSecret(
    params: CrearSecretMikrotikParams,
  ): ComandoRouterOsConstruido {
    this.assertBoolean(params.deshabilitado, 'deshabilitado');

    const usuario = this.escapeUsername(params.usuarioPppoe);

    const password = this.escaper.escaparCadena(params.passwordPppoe, {
      campo: 'passwordPppoe',

      maxBytes: MikrotikPppoeCommandBuilder.MAX_PASSWORD_BYTES,
    });

    const perfil = this.escapeProfile(params.codigoPerfil);

    const disabled = params.deshabilitado ? 'yes' : 'no';

    const commentArgument = this.buildCommentArgument(params.comentario);

    const sanitizedCommentArgument = commentArgument
      ? ' comment="<comentario>"'
      : '';

    const selector = `[/ppp secret find where name=${usuario}]`;

    const sanitizedSelector = '[/ppp secret find where name="<usuario>"]';

    const command = [
      `:local ids ${selector};`,

      ':if ([:len $ids] > 0) do={:error "CRM_SECRET_YA_EXISTE"};',

      [
        '/ppp secret add',

        `name=${usuario}`,

        `password=${password}`,

        `profile=${perfil}`,

        'service=pppoe',

        `disabled=${disabled}${commentArgument};`,
      ].join(' '),

      ':put "CRM_OK"',
    ].join(' ');

    const sanitizedCommand = [
      `:local ids ${sanitizedSelector};`,

      ':if ([:len $ids] > 0) do={:error "CRM_SECRET_YA_EXISTE"};',

      [
        '/ppp secret add',

        'name="<usuario>"',

        'password="<redacted>"',

        `profile=${perfil}`,

        'service=pppoe',

        `disabled=${disabled}${sanitizedCommentArgument};`,
      ].join(' '),

      ':put "CRM_OK"',
    ].join(' ');

    return this.createResult(command, sanitizedCommand);
  }

  construirHabilitarSecret(
    params: GestionarSecretMikrotikParams,
  ): ComandoRouterOsConstruido {
    return this.buildSingleSecretMutation('enable', params);
  }

  construirDeshabilitarSecret(
    params: GestionarSecretMikrotikParams,
  ): ComandoRouterOsConstruido {
    return this.buildSingleSecretMutation('disable', params);
  }

  construirEliminarSecret(
    params: GestionarSecretMikrotikParams,
  ): ComandoRouterOsConstruido {
    return this.buildSingleSecretMutation('remove', params);
  }

  construirBuscarSesionesActivas(
    params: RemoverSesionActivaMikrotikParams,
  ): ComandoRouterOsConstruido {
    const usuario = this.escapeUsername(params.usuarioPppoe);

    const selector = [
      '/ppp active print',
      'as-value',
      'proplist=name,address,uptime',
      `where name=${usuario}`,
    ].join(' ');

    const selectorSanitizado = [
      '/ppp active print',
      'as-value',
      'proplist=name,address,uptime',
      'where name="<usuario>"',
    ].join(' ');

    const command = [
      `:local rows [${selector}];`,

      ':put ("CRM_ACTIVE_COUNT=" . [:len $rows]);',

      ':foreach row in=$rows do={',

      ':put "CRM_ACTIVE_BEGIN";',

      ':put ("CRM_ACTIVE_NAME=" . ($row->"name"));',

      ':put ("CRM_ACTIVE_ADDRESS=" . ($row->"address"));',

      ':put ("CRM_ACTIVE_UPTIME=" . ($row->"uptime"));',

      ':put "CRM_ACTIVE_END";',

      '};',
    ].join(' ');

    const sanitizedCommand = [
      `:local rows [${selectorSanitizado}];`,

      ':put ("CRM_ACTIVE_COUNT=" . [:len $rows]);',

      ':foreach row in=$rows do={',

      ':put "CRM_ACTIVE_BEGIN";',

      ':put "CRM_ACTIVE_NAME=<usuario>";',

      ':put ("CRM_ACTIVE_ADDRESS=" . ($row->"address"));',

      ':put ("CRM_ACTIVE_UPTIME=" . ($row->"uptime"));',

      ':put "CRM_ACTIVE_END";',

      '};',
    ].join(' ');

    return this.createResult(command, sanitizedCommand);
  }

  construirRemoverSesionesActivas(
    params: RemoverSesionActivaMikrotikParams,
  ): ComandoRouterOsConstruido {
    const usuario = this.escapeUsername(params.usuarioPppoe);

    const selector = `[/ppp active find where name=${usuario}]`;

    const sanitizedSelector = '[/ppp active find where name="<usuario>"]';

    return this.createResult(
      [
        `:local ids ${selector};`,

        ':local total [:len $ids];',

        ':if ($total > 0) do={',

        '/ppp active remove $ids;',

        '};',

        ':put ("CRM_REMOVED=" . $total);',
      ].join(' '),

      [
        `:local ids ${sanitizedSelector};`,

        ':local total [:len $ids];',

        ':if ($total > 0) do={',

        '/ppp active remove $ids;',

        '};',

        ':put ("CRM_REMOVED=" . $total);',
      ].join(' '),
    );
  }

  private buildSingleSecretMutation(
    action: AccionSecretRouterOs,
    params: GestionarSecretMikrotikParams,
  ): ComandoRouterOsConstruido {
    const usuario = this.escapeUsername(params.usuarioPppoe);

    const selector = `[/ppp secret find where name=${usuario}]`;

    const sanitizedSelector = '[/ppp secret find where name="<usuario>"]';

    const command = [
      `:local ids ${selector};`,

      ':if ([:len $ids] = 0) do={:error "CRM_SECRET_NO_ENCONTRADO"};',

      ':if ([:len $ids] > 1) do={:error "CRM_SECRET_DUPLICADO"};',

      `/ppp secret ${action} $ids;`,

      ':put "CRM_OK"',
    ].join(' ');

    const sanitizedCommand = [
      `:local ids ${sanitizedSelector};`,

      ':if ([:len $ids] = 0) do={:error "CRM_SECRET_NO_ENCONTRADO"};',

      ':if ([:len $ids] > 1) do={:error "CRM_SECRET_DUPLICADO"};',

      `/ppp secret ${action} $ids;`,

      ':put "CRM_OK"',
    ].join(' ');

    return this.createResult(command, sanitizedCommand);
  }

  private escapeUsername(value: string): string {
    return this.escaper.escaparCadena(value, {
      campo: 'usuarioPppoe',

      maxBytes: MikrotikPppoeCommandBuilder.MAX_USUARIO_BYTES,

      rechazarEspaciosExternos: true,
    });
  }

  private escapeProfile(value: string): string {
    return this.escaper.escaparCadena(value, {
      campo: 'codigoPerfil',

      maxBytes: MikrotikPppoeCommandBuilder.MAX_PERFIL_BYTES,

      rechazarEspaciosExternos: true,
    });
  }

  private buildCommentArgument(value?: string | null): string {
    if (value === undefined || value === null || value.trim().length === 0) {
      return '';
    }

    const comentario = this.escaper.escaparCadena(value, {
      campo: 'comentario',

      maxBytes: MikrotikPppoeCommandBuilder.MAX_COMENTARIO_BYTES,
    });

    return ` comment=${comentario}`;
  }

  private assertBoolean(value: boolean, field: string): void {
    if (typeof value !== 'boolean') {
      throw new TypeError(`${field} debe ser booleano.`);
    }
  }

  private createResult(
    comando: string,
    comandoSanitizado: string,
  ): ComandoRouterOsConstruido {
    return Object.freeze({
      comando,

      comandoSanitizado,
    });
  }
}
