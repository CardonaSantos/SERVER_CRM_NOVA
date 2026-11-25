import { Inject, Injectable } from '@nestjs/common';

import {
  PrepararPrealtaPppoeInput,
  PrepararPrealtaPppoeResult,
  PppoePrealtaPort,
} from '../../public/pppoe-prealta.port';

import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';

import {
  PPPOE_SECRET_CIPHER,
  PppoeSecretCipherPort,
} from 'src/modules/pppoe-credentials/public/pppoe-secret-cipher.port';

import {
  PPPOE_CREDENTIAL_GENERATOR,
  PppoeCredentialGeneratorPort,
} from 'src/modules/pppoe-credentials/public/pppoe-credential-generator.port';

import {
  PPPOE_AUDITORIA,
  PppoeAuditoriaFacadePort,
} from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.facade.port';

import {
  EstadoCuentaPppoe,
  ClientePppoeCuentaReadModel,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';
import {
  PPPOE_PERFIL_HOMOLOGACION,
  PppoePerfilHomologacionFacadePort,
} from 'src/modules/pppoe-perfil-homologacion/public/pppoe-perfil-homologacion.facade.port';
import { PerfilHomologacionNoEncontradoError } from 'src/modules/pppoe-perfil-homologacion/public/pppoe-perfil-homologacion.types';
import {
  ProvisionamientoPppoeDatosInvalidosError,
  ProvisionamientoPppoeEstadoInvalidoError,
  UsuarioPppoeEnUsoError,
} from '../../domain/errors/pppoe-automatizacion.errors';

@Injectable()
export class PrepararPrealtaPppoeUseCase implements PppoePrealtaPort {
  constructor(
    @Inject(PPPOE_PERFIL_HOMOLOGACION)
    private readonly perfilesHomologacion: PppoePerfilHomologacionFacadePort,

    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,

    @Inject(PPPOE_CREDENTIAL_GENERATOR)
    private readonly credentialGenerator: PppoeCredentialGeneratorPort,

    @Inject(PPPOE_SECRET_CIPHER)
    private readonly secretCipher: PppoeSecretCipherPort,

    @Inject(PPPOE_AUDITORIA)
    private readonly auditoria: PppoeAuditoriaFacadePort,
  ) {}

  async preparar(
    input: PrepararPrealtaPppoeInput,
  ): Promise<PrepararPrealtaPppoeResult> {
    this.validateInput(input);

    const perfil =
      await this.perfilesHomologacion.buscarActivoPorRouterYServicio({
        mikrotikRouterId: input.mikrotikRouterId,
        servicioInternetId: input.servicioInternetId,
      });

    if (!perfil || perfil.id === null) {
      throw new PerfilHomologacionNoEncontradoError();
    }

    const cuentaExistente = await this.cuentasPppoe.buscarPorAccesoInternet(
      input.accesoInternetId,
    );

    if (cuentaExistente) {
      return this.resolveExistingAccount({
        input,
        perfilHomologacionId: perfil.id,
        cuenta: cuentaExistente,
      });
    }

    const credenciales = this.credentialGenerator.generate({
      clienteId: input.clienteId,
      fecha: input.fechaReferencia,
    });

    const cuentaVigenteConMismoUsuario =
      await this.cuentasPppoe.buscarVigentePorUsuario(credenciales.usuario);

    if (cuentaVigenteConMismoUsuario) {
      throw new UsuarioPppoeEnUsoError(
        `El usuario PPPoE ${credenciales.usuario} ya está asignado a una cuenta vigente.`,
      );
    }

    const secretoProtegido = await this.secretCipher.encrypt(
      credenciales.secretoPlano,
    );

    const cuentaCreada = await this.cuentasPppoe.crear({
      empresaId: input.empresaId,

      accesoInternetId: input.accesoInternetId,

      perfilHomologacionId: perfil.id,

      usuario: credenciales.usuario,

      secretoCifrado: secretoProtegido.secretoCifrado,

      secretoIv: secretoProtegido.secretoIv,

      secretoAuthTag: secretoProtegido.secretoAuthTag,

      versionClave: secretoProtegido.versionClave,

      generadoPorId: input.operadorId,
    });

    await this.registrarAuditoriasPrealta({
      input,

      cuentaPppoeId: cuentaCreada.id,

      perfilHomologacionId: perfil.id,

      usuario: cuentaCreada.usuario,

      codigoPerfil: perfil.codigoPerfil,

      generadoEn: credenciales.generadoEn,
    });

    return this.toResult(cuentaCreada, true);
  }

  private async resolveExistingAccount(params: {
    input: PrepararPrealtaPppoeInput;

    perfilHomologacionId: number;

    cuenta: ClientePppoeCuentaReadModel;
  }): Promise<PrepararPrealtaPppoeResult> {
    const { input, perfilHomologacionId, cuenta } = params;

    if (cuenta.empresaId !== input.empresaId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'El acceso de internet ya tiene una cuenta PPPoE perteneciente a otra empresa.',
      );
    }

    if (cuenta.perfilHomologacionId !== perfilHomologacionId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'El acceso ya tiene una cuenta PPPoE asociada a una homologación diferente.',
      );
    }

    if (
      cuenta.estado === EstadoCuentaPppoe.ELIMINADA ||
      cuenta.estado === EstadoCuentaPppoe.CANCELADA
    ) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE asociada al acceso pertenece a un ciclo terminado. Debe utilizarse un nuevo acceso PPPoE.',
      );
    }

    return this.toResult(cuenta, false);
  }

  private async registrarAuditoriasPrealta(params: {
    input: PrepararPrealtaPppoeInput;

    cuentaPppoeId: number;

    perfilHomologacionId: number;

    usuario: string;

    codigoPerfil: string;

    generadoEn: Date;
  }): Promise<void> {
    const {
      input,
      cuentaPppoeId,
      perfilHomologacionId,
      usuario,
      codigoPerfil,
      generadoEn,
    } = params;

    await this.auditoria.registrarEventoCuenta({
      empresaId: input.empresaId,

      clienteId: input.clienteId,

      accesoInternetId: input.accesoInternetId,

      cuentaPppoeId,

      perfilHomologacionId,

      instalacionId: input.instalacionId ?? null,

      operadorId: input.operadorId,

      origen: OrigenOperacionPppoe.OPERADOR,

      accion: AccionAuditoriaPppoe.CONTRASENA_GENERADA,

      descripcion: 'Se generó la contraseña de la cuenta PPPoE.',

      usuarioPppoeSnapshot: usuario,

      perfilCodigoSnapshot: codigoPerfil,

      operadorNombreSnapshot: input.operadorNombre ?? null,

      datos: {
        algoritmo: 'FORMATO_NOVA_PPPOE',

        credencialCifrada: true,
      },

      ipOrigen: input.ipOrigen ?? null,

      userAgent: input.userAgent ?? null,

      creadoEn: generadoEn,
    });

    await this.auditoria.registrarTransicionCuenta({
      empresaId: input.empresaId,

      clienteId: input.clienteId,

      accesoInternetId: input.accesoInternetId,

      cuentaPppoeId,

      perfilHomologacionId,

      instalacionId: input.instalacionId ?? null,

      operadorId: input.operadorId,

      origen: OrigenOperacionPppoe.OPERADOR,

      accion: AccionAuditoriaPppoe.PREALTA_CREADA,

      descripcion: 'Se creó la prealta de la cuenta PPPoE.',

      estadoCuentaAnterior: null,

      estadoCuentaNuevo: EstadoCuentaPppoe.PENDIENTE_ACTIVACION,

      usuarioPppoeSnapshot: usuario,

      perfilCodigoSnapshot: codigoPerfil,

      operadorNombreSnapshot: input.operadorNombre ?? null,

      datos: {
        mikrotikRouterId: input.mikrotikRouterId,

        servicioInternetId: input.servicioInternetId,

        requiereCreacionSecret: true,
      },

      ipOrigen: input.ipOrigen ?? null,

      userAgent: input.userAgent ?? null,

      creadoEn: generadoEn,
    });
  }

  private toResult(
    cuenta: ClientePppoeCuentaReadModel,
    creada: boolean,
  ): PrepararPrealtaPppoeResult {
    return {
      cuentaPppoeId: cuenta.id,

      empresaId: cuenta.empresaId,

      accesoInternetId: cuenta.accesoInternetId,

      perfilHomologacionId: cuenta.perfilHomologacionId,

      usuario: cuenta.usuario,

      estado: cuenta.estado,

      generadoEn: cuenta.generadoEn,

      creada,
    };
  }

  private validateInput(input: PrepararPrealtaPppoeInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.clienteId, 'clienteId');

    this.assertPositiveInteger(input.accesoInternetId, 'accesoInternetId');

    this.assertPositiveInteger(input.servicioInternetId, 'servicioInternetId');

    this.assertPositiveInteger(input.mikrotikRouterId, 'mikrotikRouterId');

    this.assertPositiveInteger(input.operadorId, 'operadorId');

    if (input.instalacionId !== null && input.instalacionId !== undefined) {
      this.assertPositiveInteger(input.instalacionId, 'instalacionId');
    }

    if (
      input.fechaReferencia !== undefined &&
      (!(input.fechaReferencia instanceof Date) ||
        Number.isNaN(input.fechaReferencia.getTime()))
    ) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'fechaReferencia debe ser una fecha válida.',
      );
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        `${field} debe ser un entero positivo.`,
      );
    }
  }
}
