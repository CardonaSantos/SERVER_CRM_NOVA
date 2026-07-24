import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PppoeAuditoriaEntity } from '../../../pppoe-auditoria/domain/entities/pppoe-auditoria.entity';

import { PrepararPrealtaPppoeInput } from '../inputs/preparar-prealta-pppoe.input';

import { PrepararPrealtaPppoeResult } from '../results/preparar-prealta-pppoe.result';
import { PppoePrealtaPort } from '../../domain/ports/pppoe-prealta.port';
import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from 'src/modules/pppoe-perfil-homologacion/infra/tokens/ppoe-perfil-homologacion.token';
import { PerfilHomologacionRepositoryPort } from 'src/modules/pppoe-perfil-homologacion/domain/ports/ppoe-perfil-homologacion.port';
import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';
import {
  PPPOE_CREDENTIAL_GENERATOR,
  PPPOE_SECRET_CIPHER,
} from 'src/modules/pppoe-cliente-cuenta/infra/tokens/pppoe-cliente-cuenta.token';
import { PppoeCredentialGeneratorPort } from 'src/modules/pppoe-credentials/application/ports/pppoe-credential-generator.port';
import { PppoeSecretCipherPort } from 'src/modules/pppoe-credentials/application/ports/pppoe-secret-cipher.port';
import {
  PPPOE_AUDITORIA_REPOSITORY,
  PppoeAuditoriaRepositoryPort,
} from 'src/modules/pppoe-auditoria/domain/ports/pppoe-auditoria-repository';
import { ClientePppoeCuentaEntity } from 'src/modules/pppoe-cliente-cuenta/domain/entities/ppoe-cliente-cuenta.entity';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';
import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

@Injectable()
export class PrepararPrealtaPppoeUseCase implements PppoePrealtaPort {
  constructor(
    @Inject(PPPOE_PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfilRepository: PerfilHomologacionRepositoryPort,

    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaRepository: ClientePppoeCuentaRepositoryPort,

    @Inject(PPPOE_CREDENTIAL_GENERATOR)
    private readonly credentialGenerator: PppoeCredentialGeneratorPort,

    @Inject(PPPOE_SECRET_CIPHER)
    private readonly secretCipher: PppoeSecretCipherPort,

    @Inject(PPPOE_AUDITORIA_REPOSITORY)
    private readonly auditoriaRepository: PppoeAuditoriaRepositoryPort,
  ) {}

  async preparar(
    input: PrepararPrealtaPppoeInput,
  ): Promise<PrepararPrealtaPppoeResult> {
    this.validateInput(input);

    const perfil = await this.perfilRepository.findActiveByRouterAndService({
      mikrotikRouterId: input.mikrotikRouterId,

      servicioInternetId: input.servicioInternetId,
    });

    if (!perfil || perfil.id === null) {
      throw new NotFoundException(
        'No existe una homologación PPPoE activa para el router y el servicio de internet indicados.',
      );
    }

    const cuentaExistente = await this.cuentaRepository.findByAccesoInternetId(
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

    const cuentaConMismoUsuario = await this.cuentaRepository.findByUsuario(
      credenciales.usuario,
    );

    if (cuentaConMismoUsuario) {
      throw new ConflictException(
        `El usuario PPPoE ${credenciales.usuario} ya está asignado a otro acceso de internet.`,
      );
    }

    const secretoProtegido = await this.secretCipher.encrypt(
      credenciales.secretoPlano,
    );

    const cuentaNueva = ClientePppoeCuentaEntity.create({
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

    const cuentaCreada = await this.cuentaRepository.create(cuentaNueva);

    if (cuentaCreada.id === null) {
      throw new Error(
        'La cuenta PPPoE fue creada sin un identificador persistido.',
      );
    }

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

    cuenta: ClientePppoeCuentaEntity;
  }): Promise<PrepararPrealtaPppoeResult> {
    const { input, perfilHomologacionId, cuenta } = params;

    if (cuenta.id === null) {
      throw new Error('La cuenta PPPoE existente no tiene identificador.');
    }

    if (cuenta.empresaId !== input.empresaId) {
      throw new ConflictException(
        'El acceso de internet ya tiene una cuenta PPPoE perteneciente a otra empresa.',
      );
    }

    if (cuenta.perfilHomologacionId !== perfilHomologacionId) {
      throw new ConflictException(
        'El acceso ya tiene una cuenta PPPoE asociada a una homologación diferente.',
      );
    }

    if (cuenta.estado === EstadoCuentaPppoe.ELIMINADA) {
      throw new ConflictException(
        'La cuenta PPPoE asociada al acceso ya fue eliminada. Debe crearse un nuevo acceso o ejecutarse un flujo explícito de reprovisión.',
      );
    }

    /*
     * La prealta ya existe.
     *
     * No volvemos a generar la contraseña,
     * no rotamos el secreto y no duplicamos auditorías.
     */
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

    const auditoriaContrasena = PppoeAuditoriaEntity.registrarEventoCuenta({
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

    await this.auditoriaRepository.create(auditoriaContrasena);

    const auditoriaPrealta = PppoeAuditoriaEntity.registrarTransicionCuenta({
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

    await this.auditoriaRepository.create(auditoriaPrealta);
  }

  private toResult(
    cuenta: ClientePppoeCuentaEntity,
    creada: boolean,
  ): PrepararPrealtaPppoeResult {
    if (cuenta.id === null) {
      throw new Error(
        'No es posible generar el resultado de una cuenta PPPoE sin identificador.',
      );
    }

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
      throw new BadRequestException(
        'fechaReferencia debe ser una fecha válida.',
      );
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
