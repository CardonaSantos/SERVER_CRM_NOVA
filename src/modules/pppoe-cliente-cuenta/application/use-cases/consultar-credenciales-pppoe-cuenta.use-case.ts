import { Inject, Injectable } from '@nestjs/common';

import { CuentaPppoeNoEncontradaError } from '../../domain/errors/pppoe-cliente-cuenta.errors';

import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from '../../domain/ports/cliente-pppoe-cuenta-repository.port';

import {
  CLIENTE_PPPOE_CUENTA_QUERY,
  ClientePppoeCuentaQueryPort,
} from '../../domain/ports/cliente-pppoe-cuenta-query.port';

import {
  PPPOE_SECRET_CIPHER,
  PppoeSecretCipherPort,
} from 'src/modules/pppoe-credentials/public/pppoe-secret-cipher.port';
import {
  PPPOE_AUDITORIA,
  PppoeAuditoriaFacadePort,
} from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.facade.port';

import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';

export type ConsultarCredencialesPppoeCuentaInput = {
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

    @Inject(PPPOE_AUDITORIA)
    private readonly auditoria: PppoeAuditoriaFacadePort,
  ) {}

  async execute(
    input: ConsultarCredencialesPppoeCuentaInput,
  ): Promise<ConsultarCredencialesPppoeCuentaResult> {
    const detalle = await this.cuentaQuery.findDetailById(input.cuentaPppoeId);
    if (!detalle) throw new CuentaPppoeNoEncontradaError();

    /**
     * La entidad contiene únicamente el material cifrado.
     * La contraseña nunca está almacenada en texto plano.
     */
    const cuenta = await this.cuentaRepository.findById(input.cuentaPppoeId);

    if (!cuenta) throw new CuentaPppoeNoEncontradaError();

    const contrasena = await this.secretCipher.decrypt(cuenta.secretoProtegido);

    /**
     * Registramos la visualización únicamente después
     * de que el descifrado haya sido exitoso.
     *
     * Nunca enviamos la contraseña a auditoría.
     */
    await this.auditoria.registrarEventoCuenta({
      empresaId: cuenta.empresaId,

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

    return {
      cuentaPppoeId: input.cuentaPppoeId,

      usuario: cuenta.usuario,

      contrasena,
    };
  }
}
