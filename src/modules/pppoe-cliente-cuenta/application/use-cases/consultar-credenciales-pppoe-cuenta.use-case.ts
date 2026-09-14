import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from '../../domain/ports/pppoe-cliente-cuenta.port';

import {
  CLIENTE_PPPOE_CUENTA_QUERY,
  ClientePppoeCuentaQueryPort,
} from '../../domain/ports/pppoe-cliente-cuenta-query.port';

import { PPPOE_SECRET_CIPHER } from '../../infra/tokens/pppoe-cliente-cuenta.token';

import { PppoeSecretCipherPort } from 'src/modules/pppoe-credentials/application/ports/pppoe-secret-cipher.port';

import {
  PPPOE_AUDITORIA_REPOSITORY,
  PppoeAuditoriaRepositoryPort,
} from 'src/modules/pppoe-auditoria/domain/ports/pppoe-auditoria-repository';

import { PppoeAuditoriaEntity } from 'src/modules/pppoe-auditoria/domain/entities/pppoe-auditoria.entity';

import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

export type ConsultarCredencialesPppoeCuentaInput = {
  empresaId: number;

  cuentaPppoeId: number;

  operadorId: number;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

export type ConsultarCredencialesPppoeCuentaResult = {
  cuentaPppoeId: number;

  usuario: string;

  contrasena: string;
};

@Injectable()
export class ConsultarCredencialesPppoeCuentaUseCase {
  constructor(
    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaRepository: ClientePppoeCuentaRepositoryPort,

    @Inject(CLIENTE_PPPOE_CUENTA_QUERY)
    private readonly cuentaQuery: ClientePppoeCuentaQueryPort,

    @Inject(PPPOE_SECRET_CIPHER)
    private readonly secretCipher: PppoeSecretCipherPort,

    @Inject(PPPOE_AUDITORIA_REPOSITORY)
    private readonly auditoriaRepository: PppoeAuditoriaRepositoryPort,
  ) {}

  async execute(
    input: ConsultarCredencialesPppoeCuentaInput,
  ): Promise<ConsultarCredencialesPppoeCuentaResult> {
    this.validateInput(input);

    /**
     * Primero consultamos mediante el read model,
     * aplicando el scope de empresa.
     *
     * De esta forma una cuenta perteneciente a otra empresa
     * se comporta como inexistente.
     */
    const detalle = await this.cuentaQuery.findDetailById({
      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,
    });

    if (!detalle) {
      throw new NotFoundException('Cuenta PPPoE no encontrada.');
    }

    /**
     * La entidad contiene únicamente el material cifrado.
     * La contraseña nunca está almacenada en texto plano.
     */
    const cuenta = await this.cuentaRepository.findById(input.cuentaPppoeId);

    if (!cuenta || cuenta.empresaId !== input.empresaId) {
      throw new NotFoundException('Cuenta PPPoE no encontrada.');
    }

    const contrasena = await this.secretCipher.decrypt(cuenta.secretoProtegido);

    /**
     * Registramos la visualización únicamente después
     * de que el descifrado haya sido exitoso.
     *
     * Nunca enviamos la contraseña a auditoría.
     */
    const auditoria = PppoeAuditoriaEntity.registrarEventoCuenta({
      empresaId: input.empresaId,

      clienteId: detalle.cliente.id,

      accesoInternetId: cuenta.accesoInternetId,

      cuentaPppoeId: input.cuentaPppoeId,

      perfilHomologacionId: cuenta.perfilHomologacionId,

      operadorId: input.operadorId,

      operadorNombreSnapshot: input.operadorNombre ?? null,

      origen: OrigenOperacionPppoe.OPERADOR,

      accion: AccionAuditoriaPppoe.HOJA_VISUALIZADA,

      descripcion:
        'Se visualizaron las credenciales PPPoE desde el detalle administrativo de la cuenta.',

      usuarioPppoeSnapshot: cuenta.usuario,

      perfilCodigoSnapshot: detalle.perfilHomologacion.codigoPerfil,

      datos: {
        credencialesReveladas: true,

        origenConsulta: 'DETALLE_CUENTA',
      },

      ipOrigen: input.ipOrigen ?? null,

      userAgent: input.userAgent ?? null,
    });

    await this.auditoriaRepository.create(auditoria);

    return {
      cuentaPppoeId: input.cuentaPppoeId,

      usuario: cuenta.usuario,

      contrasena,
    };
  }

  private validateInput(input: ConsultarCredencialesPppoeCuentaInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.cuentaPppoeId, 'cuentaPppoeId');

    this.assertPositiveInteger(input.operadorId, 'operadorId');
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
