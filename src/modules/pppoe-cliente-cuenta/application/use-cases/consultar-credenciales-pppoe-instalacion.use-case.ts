import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';

import { PPPOE_SECRET_CIPHER } from 'src/modules/pppoe-cliente-cuenta/infra/tokens/pppoe-cliente-cuenta.token';

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
import { PppoeCredencialesInstalacionPort } from 'src/modules/pppoe-automatizacion/domain/ports/pppoe-credenciales-instalacion.port';
import { ConsultarCredencialesPppoeInstalacionInput } from 'src/modules/pppoe-automatizacion/application/inputs/consultar-credenciales-pppoe-instalacion.input';
import {
  ConsultarCredencialesPppoeInstalacionResult,
  CredencialPppoeInstalacionItem,
} from 'src/modules/pppoe-automatizacion/application/inputs/consultar-credenciales-pppoe-instalacion.result';

@Injectable()
export class ConsultarCredencialesPppoeInstalacionUseCase
  implements PppoeCredencialesInstalacionPort
{
  constructor(
    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaRepository: ClientePppoeCuentaRepositoryPort,

    @Inject(PPPOE_SECRET_CIPHER)
    private readonly secretCipher: PppoeSecretCipherPort,

    @Inject(PPPOE_AUDITORIA_REPOSITORY)
    private readonly auditoriaRepository: PppoeAuditoriaRepositoryPort,
  ) {}

  async consultar(
    input: ConsultarCredencialesPppoeInstalacionInput,
  ): Promise<ConsultarCredencialesPppoeInstalacionResult> {
    this.validateInput(input);

    const cuentas = await this.cuentaRepository.findProtectedByInstalacionId(
      input.instalacionId,
    );

    const credenciales: CredencialPppoeInstalacionItem[] = [];

    for (const cuenta of cuentas) {
      const contrasena = await this.secretCipher.decrypt({
        secretoCifrado: cuenta.secretoCifrado,
        secretoIv: cuenta.secretoIv,
        secretoAuthTag: cuenta.secretoAuthTag,
        versionClave: cuenta.versionClave,
      });

      credenciales.push({
        cuentaPppoeId: cuenta.cuentaPppoeId,

        accesoInternetId: cuenta.accesoInternetId,

        perfilHomologacionId: cuenta.perfilHomologacionId,

        mikrotikRouterId: cuenta.mikrotikRouterId,

        servicioInternetId: cuenta.servicioInternetId,

        codigoPerfil: cuenta.codigoPerfil,

        usuario: cuenta.usuario,

        contrasena,

        estadoCuenta: cuenta.estadoCuenta,

        generadoEn: cuenta.generadoEn,
      });
    }

    /*
     * Primero desciframos todas las cuentas.
     *
     * Si alguna no puede descifrarse, no devolvemos una
     * respuesta parcial ni registramos visualizaciones
     * incompletas.
     */
    for (const cuenta of cuentas) {
      await this.registrarVisualizacion({
        input,

        cuentaPppoeId: cuenta.cuentaPppoeId,

        empresaId: cuenta.empresaId,

        clienteId: cuenta.clienteId,

        accesoInternetId: cuenta.accesoInternetId,

        perfilHomologacionId: cuenta.perfilHomologacionId,

        usuario: cuenta.usuario,

        codigoPerfil: cuenta.codigoPerfil,
      });
    }

    return {
      instalacionId: input.instalacionId,

      credenciales,
    };
  }

  private async registrarVisualizacion(params: {
    input: ConsultarCredencialesPppoeInstalacionInput;

    empresaId: number;
    clienteId: number;

    accesoInternetId: number;
    cuentaPppoeId: number;
    perfilHomologacionId: number;

    usuario: string;
    codigoPerfil: string;
  }): Promise<void> {
    const {
      input,
      empresaId,
      clienteId,
      accesoInternetId,
      cuentaPppoeId,
      perfilHomologacionId,
      usuario,
      codigoPerfil,
    } = params;

    const auditoria = PppoeAuditoriaEntity.registrarEventoCuenta({
      empresaId,

      clienteId,

      accesoInternetId,

      cuentaPppoeId,

      perfilHomologacionId,

      instalacionId: input.instalacionId,

      operadorId: input.operadorId,

      operadorNombreSnapshot: input.operadorNombre ?? null,

      origen: OrigenOperacionPppoe.OPERADOR,

      accion: AccionAuditoriaPppoe.HOJA_VISUALIZADA,

      descripcion: 'Se visualizaron las credenciales PPPoE de la instalación.',

      usuarioPppoeSnapshot: usuario,

      perfilCodigoSnapshot: codigoPerfil,

      datos: {
        credencialesReveladas: true,
      },

      ipOrigen: input.ipOrigen ?? null,

      userAgent: input.userAgent ?? null,
    });

    await this.auditoriaRepository.create(auditoria);
  }

  private validateInput(
    input: ConsultarCredencialesPppoeInstalacionInput,
  ): void {
    this.assertPositiveInteger(input.instalacionId, 'instalacionId');

    this.assertPositiveInteger(input.operadorId, 'operadorId');
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
