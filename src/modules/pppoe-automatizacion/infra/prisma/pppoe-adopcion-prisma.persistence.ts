import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import { ClienteAccesoInternetEntity } from 'src/modules/pppoe-acceso-internet/domain/entities/ppoe-acceso-internet.entity';

import {
  EstadoAccesoInternet,
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
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

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

        /**
         * =====================================================
         * 1. PROTECCIÓN CONTRA CARRERAS
         * =====================================================
         *
         * Las mismas reglas funcionales del caso de uso se
         * vuelven a comprobar dentro de la transacción.
         *
         * Esto evita que dos adopciones concurrentes puedan
         * crear un nuevo ciclo PPPoE para el mismo cliente
         * o para el mismo username.
         */

        /**
         * El cliente solamente queda bloqueado cuando tiene
         * un acceso PPPoE vigente.
         *
         * BAJA representa un ciclo histórico terminado.
         */
        const accesoClienteVigente = await tx.clienteAccesoInternet.findFirst({
          where: {
            empresaId: params.empresaId,

            clienteId: params.clienteId,

            metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,

            estado: {
              in: [
                EstadoAccesoInternet.PENDIENTE,
                EstadoAccesoInternet.CONFIGURANDO,
                EstadoAccesoInternet.ACTIVO,
                EstadoAccesoInternet.SUSPENDIDO,
              ],
            },
          },

          select: {
            id: true,
            estado: true,
          },

          orderBy: {
            id: 'desc',
          },
        });

        if (accesoClienteVigente) {
          throw new Error(
            `El cliente ya posee un acceso PPPoE vigente en estado ${accesoClienteVigente.estado}.`,
          );
        }

        /**
         * El mismo username puede aparecer en ciclos históricos
         * ELIMINADOS o CANCELADOS.
         *
         * Solo impedimos crear una nueva cuenta si todavía existe
         * otra cuenta vigente con el mismo username.
         */
        const cuentaUsuarioVigente = await tx.clientePppoeCuenta.findFirst({
          where: {
            empresaId: params.empresaId,

            usuario: params.usuarioPppoe,

            estado: {
              notIn: [EstadoCuentaPppoe.ELIMINADA, EstadoCuentaPppoe.CANCELADA],
            },
          },

          select: {
            id: true,
            estado: true,
          },

          orderBy: {
            id: 'desc',
          },
        });

        if (cuentaUsuarioVigente) {
          throw new Error(
            `El usuario PPPoE "${params.usuarioPppoe}" ya se encuentra asociado a una cuenta vigente en estado ${cuentaUsuarioVigente.estado}.`,
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
