import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import { ClienteAccesoInternetEntity } from 'src/modules/pppoe-acceso-internet/domain/entities/ppoe-acceso-internet.entity';

import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import { ClienteAccesoInternetPrismaMapper } from 'src/modules/pppoe-acceso-internet/infra/prisma/cliente-acceso-internet-prisma.mapper';

// import { ClientePppoeCuentaEntity } from 'src/modules/pppoe-cliente-cuenta/domain/entities/pppoe-cliente-cuenta.entity';

import { ClientePppoeCuentaPrismaMapper } from 'src/modules/pppoe-cliente-cuenta/infra/prisma/pppoe-cliente-cuenta.mapper';

import { PppoeAuditoriaEntity } from 'src/modules/pppoe-auditoria/domain/entities/pppoe-auditoria.entity';

import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { PppoeAuditoriaPrismaMapper } from 'src/modules/pppoe-auditoria/infra/prisma/pppoe-auditoria-mapper.prisma';

import {
  PersistirAdopcionPppoeParams,
  PersistirAdopcionPppoeResult,
  PppoeAdopcionPersistencePort,
} from '../../domain/ports/pppoe-adopcion-persistence.port';
import { ClientePppoeCuentaEntity } from 'src/modules/pppoe-cliente-cuenta/domain/entities/ppoe-cliente-cuenta.entity';

@Injectable()
export class PppoeAdopcionPrismaPersistence
  implements PppoeAdopcionPersistencePort
{
  constructor(private readonly prisma: PrismaService) {}

  async persistir(
    params: PersistirAdopcionPppoeParams,
  ): Promise<PersistirAdopcionPppoeResult> {
    return this.prisma.$transaction(
      async (tx) => {
        /**
         * =====================================================
         * 1. PROTECCIÓN CONTRA CARRERAS
         * =====================================================
         *
         * El caso de uso ya validará esto antes de
         * conectarse al MikroTik, pero volvemos a comprobar
         * dentro de la transacción.
         */

        const cuentaClienteExistente = await tx.clientePppoeCuenta.findFirst({
          where: {
            empresaId: params.empresaId,

            accesoInternet: {
              is: {
                clienteId: params.clienteId,
              },
            },
          },

          select: {
            id: true,
          },
        });

        if (cuentaClienteExistente) {
          throw new Error(
            'El cliente ya posee una cuenta PPPoE registrada en el CRM.',
          );
        }

        const cuentaUsuarioExistente = await tx.clientePppoeCuenta.findFirst({
          where: {
            empresaId: params.empresaId,

            usuario: params.usuarioPppoe,
          },

          select: {
            id: true,
          },
        });

        if (cuentaUsuarioExistente) {
          throw new Error(
            `El usuario PPPoE "${params.usuarioPppoe}" ya se encuentra registrado en el CRM.`,
          );
        }

        /**
         * =====================================================
         * 2. CREAR ACCESO LOCAL
         * =====================================================
         */

        const accesoEntity = ClienteAccesoInternetEntity.adoptarExistente({
          empresaId: params.empresaId,

          clienteId: params.clienteId,

          servicioInternetId: params.servicioInternetId,

          tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,

          metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,

          estadoRemoto: params.estado.estadoAcceso,

          fechaAdopcion: params.fechaAdopcion,
        });

        const acceso = await tx.clienteAccesoInternet.create({
          data: ClienteAccesoInternetPrismaMapper.toCreatePersistence(
            accesoEntity,
          ),
        });

        /**
         * =====================================================
         * 3. CREAR CUENTA PPPoE ADOPTADA
         * =====================================================
         */

        const cuentaEntity = ClientePppoeCuentaEntity.adoptarExistente({
          empresaId: params.empresaId,

          accesoInternetId: acceso.id,

          perfilHomologacionId: params.perfilHomologacionId,

          usuario: params.usuarioPppoe,

          secretoCifrado: params.secretoProtegido.secretoCifrado,

          secretoIv: params.secretoProtegido.secretoIv,

          secretoAuthTag: params.secretoProtegido.secretoAuthTag,

          versionClave: params.secretoProtegido.versionClave,

          estadoRemoto: params.estado.estadoCuenta,

          adoptadoPorId: params.adoptadoPorId,

          fechaAdopcion: params.fechaAdopcion,
        });

        const cuenta = await tx.clientePppoeCuenta.create({
          data: ClientePppoeCuentaPrismaMapper.toCreatePersistence(
            cuentaEntity,
          ),
        });

        /**
         * =====================================================
         * 4. AUDITORÍA
         * =====================================================
         *
         * Nunca incluimos:
         *
         * - contraseña;
         * - secreto cifrado;
         * - IV;
         * - authTag.
         */

        const auditoriaEntity = PppoeAuditoriaEntity.create({
          empresaId: params.empresaId,

          clienteId: params.clienteId,

          accesoInternetId: acceso.id,

          cuentaPppoeId: cuenta.id,

          perfilHomologacionId: params.perfilHomologacionId,

          operadorId: params.adoptadoPorId,

          origen: OrigenOperacionPppoe.OPERADOR,

          accion: AccionAuditoriaPppoe.CUENTA_EXTERNA_ADOPTADA,

          descripcion:
            'Cuenta PPPoE preexistente verificada y adoptada por el CRM sin modificar MikroTik.',

          /**
           * La cuenta no tenía un estado anterior
           * dentro del CRM.
           */
          estadoCuentaAnterior: null,

          estadoCuentaNuevo: params.estado.estadoCuenta,

          usuarioPppoeSnapshot: params.usuarioPppoe,

          perfilCodigoSnapshot: params.auditoria.codigoPerfil,

          datos: {
            tipo: 'ADOPCION_CUENTA_EXISTENTE',

            mikrotikRouterId: params.mikrotikRouterId,

            servicioInternetId: params.servicioInternetId,

            servicioRemoto: params.auditoria.servicioRemoto,

            cumpleFormatoNova: params.auditoria.cumpleFormatoNova,

            estadoCuentaRemoto: params.estado.estadoCuenta,

            estadoAccesoRemoto: params.estado.estadoAcceso,

            modificacionRemota: false,
          },

          creadoEn: params.fechaAdopcion,
        });

        const auditoria = await tx.pppoeAuditoria.create({
          data: PppoeAuditoriaPrismaMapper.toCreatePersistence(auditoriaEntity),
        });

        return {
          empresaId: params.empresaId,

          clienteId: params.clienteId,

          accesoInternetId: acceso.id,

          cuentaPppoeId: cuenta.id,

          perfilHomologacionId: params.perfilHomologacionId,

          mikrotikRouterId: params.mikrotikRouterId,

          servicioInternetId: params.servicioInternetId,

          usuarioPppoe: params.usuarioPppoe,

          estadoCuenta: params.estado.estadoCuenta,

          estadoAcceso: params.estado.estadoAcceso,

          adoptadoPorId: params.adoptadoPorId,

          adoptadoEn: params.fechaAdopcion,

          auditoriaId: auditoria.id,
        };
      },
      {
        /**
         * Reduce el riesgo de dos adopciones concurrentes
         * sobre el mismo cliente/usuario.
         */
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
