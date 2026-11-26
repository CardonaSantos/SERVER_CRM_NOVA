import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CategoriaMedia,
  EstadoCliente,
  EstadoCobranzaCliente,
  EstadoMedia,
  EstadoServicioMikrotik,
  Prisma,
  StateFacturaInternet,
} from '@prisma/client';

import { conCobranza } from 'src/Utils/filtro-cobranza';
import { GetClientesRutaQueryDto } from './pagination/cliente-internet.dto';
import { GetCustomersQueryDto } from './dto/query-table';
import { VerifyCustomerService } from 'src/credito/verify-customer/app/verify-customer.service';
import { selectCustomerCampaignWhatsapp } from './select/select-customer';
import { mapCustomersCampaingWhatsapp } from './common/mappers';
import { CustomersCampaingQuery } from './query/customers-campaing-query.dto';

const strip = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const esServicioMikrotikActivo = (estado?: EstadoServicioMikrotik) =>
  estado === EstadoServicioMikrotik.ACTIVO;

@Injectable()
export class ClienteInternetService {
  private readonly logger = new Logger(ClienteInternetService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly verifyCreditService: VerifyCustomerService,
  ) {}

  /**
   * Obtiene un cliente con todas sus relaciones y sus facturas.
   * @param clienteInternetId El ID del cliente a buscar.
   * @returns Un objeto con los datos del cliente y sus relaciones (facturas, pagos, tickets…).
   */
  async getDetallesClienteInternet2(clienteInternetId: number) {
    try {
      const clienteInternetWithRelations =
        await this.prisma.clienteInternet.findUnique({
          where: { id: clienteInternetId },
          include: {
            medias: {
              where: {
                categoria: {
                  notIn: ['SOPORTE_TICKET'],
                },
              },
              select: {
                id: true,
                cdnUrl: true,
                titulo: true,
                descripcion: true,
                categoria: true,
                estado: true,
                etiqueta: true,
              },
            },
            asesor: { select: { id: true, nombre: true } },
            municipio: { select: { id: true, nombre: true } },
            departamento: { select: { id: true, nombre: true } },
            sector: { select: { id: true, nombre: true } },
            empresa: { select: { id: true, nombre: true } },
            IP: {
              select: {
                id: true,
                direccionIp: true,
                gateway: true,
                mascara: true,
              },
            },
            ubicacion: { select: { id: true, latitud: true, longitud: true } },
            saldoCliente: {
              select: {
                id: true,
                saldoFavor: true,
                saldoPendiente: true,
                totalPagos: true,
                ultimoPago: true,
              },
            },
            ticketSoporte: {
              select: {
                id: true,
                titulo: true,
                descripcion: true,
                estado: true,
                prioridad: true,
                fechaApertura: true,
                fechaCierre: true,
                creadoPor: true,
                etiquetas: {
                  select: {
                    id: true,
                    etiqueta: true,
                  },
                },
                fechaInicioAtencion: true,
                fechaResolucionTecnico: true,
                fechaAsignacion: true,
                resumen: true,
                SeguimientoTicket: {
                  select: {
                    id: true,
                    descripcion: true,
                    creadoEn: true,
                    usuario: {
                      select: {
                        id: true,
                        rol: true,
                        nombre: true,
                        perfil: {
                          select: {
                            avatarUrl: true,
                            bio: true,
                            portadaUrl: true,
                          },
                        },
                      },
                    },
                  },
                },

                tecnico: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
                asignaciones: {
                  select: {
                    tecnico: {
                      select: {
                        id: true,
                        nombre: true,
                      },
                    },
                  },
                },
              },
            },
            facturaInternet: {
              select: {
                //AHORA LLAMO AL COBRADOR
                id: true,
                creador: {
                  select: {
                    id: true,
                    nombre: true,
                    rol: true,
                  },
                },
                montoPago: true,
                creadoEn: true,
                fechaPagoEsperada: true,
                saldoPendiente: true,
                estadoFacturaInternet: true,
                fechaPagada: true,
                periodo: true, //NUEVO Y VERIFICADOR
                pagos: {
                  select: {
                    id: true,
                    montoPagado: true,
                    metodoPago: true,
                    fechaPago: true,
                    //AHORA LLAMO AL COBRADOR
                    cobrador: {
                      select: {
                        id: true,
                        nombre: true,
                        rol: true,
                      },
                    },
                  },
                },
              },
            },
            clienteServicios: {
              include: {
                servicio: {
                  select: {
                    id: true,
                    nombre: true,
                    precio: true,
                    descripcion: true,
                  },
                },
              },
            },
            servicioInternet: {
              select: {
                id: true,
                nombre: true,
                velocidad: true,
                precio: true,
              },
            },
            ContratoServicioInternet: {
              select: {
                id: true,
                fechaInstalacionProgramada: true,
                costoInstalacion: true,
                fechaPago: true,
                observaciones: true,
                // ssid: true,
                // wifiPassword: true,
                actualizadoEn: true,
                creadoEn: true,
              },
            },
            MikrotikRouter: {
              select: {
                id: true,
                nombre: true,
              },
            },
            facturacionZona: {
              select: {
                id: true,
                creadoEn: true,
                actualizadoEn: true,
                nombre: true,
                diaGeneracionFactura: true,
                diaPago: true,
                diaCorte: true,
                enviarRecordatorio: true,
              },
            },
          },
        });

      if (!clienteInternetWithRelations) {
        throw new Error('Cliente no encontrado');
      }
      const pendientes: StateFacturaInternet[] = [
        'VENCIDA',
        'PENDIENTE',
        'PARCIAL',
      ];
      const totalfacturasPendientes =
        clienteInternetWithRelations.facturaInternet.filter((f) =>
          pendientes.includes(f.estadoFacturaInternet),
        );

      const totalPendiente = totalfacturasPendientes.reduce((acc, f) => {
        const montoFactura = Number(f.montoPago ?? 0);

        const pagosRealizados = (f.pagos ?? []).reduce(
          (acc, p) => acc + Number(p.montoPagado ?? 0),
          0,
        );

        return acc + Math.max(montoFactura - pagosRealizados, 0);
      }, 0);

      const totalPagadas = clienteInternetWithRelations.facturaInternet.reduce(
        (acc: number, f) => {
          if (f.estadoFacturaInternet === 'PAGADA') acc += f.montoPago;
          return acc;
        },
        0,
      );

      // Mapeamos los datos del cliente con el formato requerido
      const clienteEjemplo = {
        id: clienteInternetWithRelations.id,
        nombre: clienteInternetWithRelations.nombre,
        apellidos: clienteInternetWithRelations.apellidos,
        telefono: clienteInternetWithRelations.telefono,
        direccion: clienteInternetWithRelations.direccion,
        dpi: clienteInternetWithRelations.dpi,
        observaciones: clienteInternetWithRelations.observaciones,
        contactoReferenciaNombre:
          clienteInternetWithRelations.contactoReferenciaNombre,
        contactoReferenciaTelefono:
          clienteInternetWithRelations.contactoReferenciaTelefono,
        estadoCliente: clienteInternetWithRelations.estadoCliente,
        estadoCobranza: clienteInternetWithRelations.estadoCobranza,

        //El estado
        estadoServicioMikrotik:
          clienteInternetWithRelations.estadoServicioMikrotik,
        //El booleano
        servicioEstado: esServicioMikrotikActivo(
          clienteInternetWithRelations.estadoServicioMikrotik,
        ),
        contrasenaWifi: clienteInternetWithRelations.contrasenaWifi,
        ssidRouter: clienteInternetWithRelations.ssidRouter,
        fechaInstalacion: clienteInternetWithRelations.fechaInstalacion,
        imagenes:
          clienteInternetWithRelations.medias.length > 0
            ? clienteInternetWithRelations.medias.map((img) => ({
                id: img.id,
                categoria: img.categoria ?? CategoriaMedia.CLIENTE_GENERAL,
                cdnUrl: img.cdnUrl ?? '',
                descripcion: img.descripcion ?? '',
                estado: img.estado ?? EstadoMedia.LISTO,
                etiqueta: img.etiqueta ?? '',
                titulo: img.titulo ?? '',
                customerId: clienteInternetWithRelations.id,
              }))
            : [],
        asesor: clienteInternetWithRelations.asesor
          ? {
              id: clienteInternetWithRelations.asesor.id,
              nombre: clienteInternetWithRelations.asesor.nombre,
            }
          : null,
        // Relación 1:1 con el servicio
        servicio: clienteInternetWithRelations.servicioInternet
          ? {
              id: clienteInternetWithRelations.servicioInternet.id,
              nombre: clienteInternetWithRelations.servicioInternet.nombre,
              precio: clienteInternetWithRelations.servicioInternet.precio,
              velocidad:
                clienteInternetWithRelations.servicioInternet.velocidad,
            }
          : null,
        municipio: clienteInternetWithRelations.municipio
          ? {
              id: clienteInternetWithRelations.municipio.id,
              nombre: clienteInternetWithRelations.municipio.nombre,
            }
          : null,
        departamento: clienteInternetWithRelations.departamento
          ? {
              id: clienteInternetWithRelations.departamento.id,
              nombre: clienteInternetWithRelations.departamento.nombre,
            }
          : null,

        sector: clienteInternetWithRelations.sector
          ? {
              id: clienteInternetWithRelations.sector.id,
              nombre: clienteInternetWithRelations.sector.nombre,
            }
          : null,

        empresa: clienteInternetWithRelations.empresa
          ? {
              id: clienteInternetWithRelations.empresa.id,
              nombre: clienteInternetWithRelations.empresa.nombre,
            }
          : null,
        IP: clienteInternetWithRelations.IP
          ? {
              id: clienteInternetWithRelations.IP.id,
              direccion: clienteInternetWithRelations.IP.direccionIp,
              mascara: clienteInternetWithRelations.IP.mascara, // Ejemplo de máscara de red
              gateway: clienteInternetWithRelations.IP.gateway, // Ejemplo de gateway
            }
          : null,
        ubicacion: clienteInternetWithRelations.ubicacion
          ? {
              id: clienteInternetWithRelations.ubicacion.id,
              latitud: clienteInternetWithRelations.ubicacion.latitud,
              longitud: clienteInternetWithRelations.ubicacion.longitud,
            }
          : null,

        mikrotik: clienteInternetWithRelations.MikrotikRouter
          ? {
              id: clienteInternetWithRelations.MikrotikRouter.id,
              nombre: clienteInternetWithRelations.MikrotikRouter.nombre,
            }
          : null,
        facturacionZona: clienteInternetWithRelations.facturacionZona
          ? {
              id: clienteInternetWithRelations.facturacionZona.id,
              nombre: clienteInternetWithRelations.facturacionZona.nombre,
              creadoEn: clienteInternetWithRelations.facturacionZona.creadoEn,
              actualizadoEn:
                clienteInternetWithRelations.facturacionZona.actualizadoEn,

              enviarRecordatorio:
                clienteInternetWithRelations.facturacionZona.enviarRecordatorio,
              diaPago: clienteInternetWithRelations.facturacionZona.diaPago,

              diaGeneracionFactura:
                clienteInternetWithRelations.facturacionZona
                  .diaGeneracionFactura,
              diaCorte: clienteInternetWithRelations.facturacionZona.diaCorte,
            }
          : null,

        contratoServicioInternet:
          clienteInternetWithRelations.ContratoServicioInternet
            ? {
                id: clienteInternetWithRelations.ContratoServicioInternet.id,
                creadoEn:
                  clienteInternetWithRelations.ContratoServicioInternet
                    .creadoEn,
                actualizadoEn:
                  clienteInternetWithRelations.ContratoServicioInternet
                    .actualizadoEn,

                costoInstalacion:
                  clienteInternetWithRelations.ContratoServicioInternet
                    .costoInstalacion,
                fechaInstalacionProgramada:
                  clienteInternetWithRelations.ContratoServicioInternet
                    .fechaInstalacionProgramada,
                fechaPago:
                  clienteInternetWithRelations.ContratoServicioInternet
                    .fechaPago,
              }
            : null,

        saldoCliente: clienteInternetWithRelations.saldoCliente
          ? {
              id: clienteInternetWithRelations.saldoCliente.id,
              saldo: totalPagadas,
              saldoPendiente: totalPendiente,
              totalPagos: totalPagadas,
              ultimoPago: clienteInternetWithRelations.saldoCliente.ultimoPago,
            }
          : null,
        creadoEn: clienteInternetWithRelations.creadoEn,
        actualizadoEn: clienteInternetWithRelations.actualizadoEn,
        ticketSoporte: clienteInternetWithRelations.ticketSoporte.map(
          (ticket) => ({
            id: ticket.id,
            titulo: ticket.titulo,
            descripcion: ticket.descripcion,
            estado: ticket.estado,
            prioridad: ticket.prioridad,
            fechaApertura: ticket.fechaApertura,
            fechaCierre: ticket.fechaCierre,

            fechaInicioAtencion: ticket.fechaInicioAtencion,

            fechaResolucionTecnico: ticket.fechaResolucionTecnico,
            resumen: ticket.resumen
              ? {
                  id: ticket.resumen.id,
                  tiempoTecnicoMinutos: ticket.resumen.tiempoTecnicoMinutos,
                  tiempoTotalMinutos: ticket.resumen.tiempoTotalMinutos,
                  resueltoComo: ticket.resumen.resueltoComo,
                  reabierto: ticket.resumen.reabierto,
                  numeroReaperturas: ticket.resumen.numeroReaperturas,
                  notasInternas: ticket.resumen.notasInternas,
                  creadoEn: ticket.resumen.creadoEn,
                }
              : null,
            etiquetas: ticket.etiquetas.map((t) => ({
              id: t.id,
              nombre: t.etiqueta.nombre,
            })),

            seguimientos: (ticket.SeguimientoTicket ?? []).map((s) => ({
              id: s.id,
              descripcion: s.descripcion,
              creadoEn: s.creadoEn,
              usuario: s.usuario
                ? {
                    id: s.usuario.id,
                    nombre: s.usuario.nombre,
                    rol: s.usuario.rol,
                    perfil: {
                      avatar: s.usuario.perfil?.avatarUrl ?? null,
                      portadaUrl: s.usuario.perfil?.portadaUrl ?? null,
                      bio: s.usuario.perfil?.bio ?? null,
                    },
                  }
                : {
                    id: -1,
                    nombre: 'Usuario eliminado',
                    rol: null,
                    perfil: {
                      avatar: null,
                      portadaUrl: null,
                      bio: null,
                    },
                  },
            })),

            creadoPro: ticket.creadoPor
              ? { id: ticket.creadoPor.id, nombre: ticket.creadoPor.nombre }
              : null,
            tecnico: ticket.tecnico
              ? { id: ticket.tecnico.id, nombre: ticket.tecnico.nombre }
              : null,
            acompanantes: (ticket.asignaciones ?? [])
              .filter((aco) => aco.tecnico)
              .map((aco) => ({
                id: aco.tecnico.id,
                nombre: aco.tecnico.nombre,
              })),
          }),
        ),
        // FECHA DE VENCIMINEOTO AQUI
        facturaInternet: clienteInternetWithRelations.facturaInternet.map(
          (factura) => ({
            id: factura.id,
            monto: factura.montoPago,
            fechaEmision: factura.creadoEn,
            fechaPagada: factura?.fechaPagada || null,
            fechaVencimiento: factura.fechaPagoEsperada,
            pagada: factura.estadoFacturaInternet === 'PAGADA' ? true : false,
            estado: factura.estadoFacturaInternet, //ESTADO DE LA FACTURA
            periodo: factura.periodo,
            creador: factura.creador
              ? {
                  id: factura.creador.id,
                  nombre: factura.creador.nombre,
                  rol: factura.creador.rol,
                }
              : null,
            pagos: factura.pagos.map((pago) => ({
              fechaPago: pago.fechaPago,
              metodoPago: pago.metodoPago,
              montoPagado: pago.montoPagado,
              cobrador: pago.cobrador
                ? {
                    id: pago.cobrador.id,
                    nombreCobrador: pago.cobrador.nombre,
                    rol: pago.cobrador.rol,
                  }
                : null,
            })),
          }),
        ),
        clienteServicio: (clienteInternetWithRelations.clienteServicios ?? [])
          .filter((cs) => cs.servicio)
          .map((cs) => ({
            id: cs.id,
            servicio: {
              id: cs.servicio.id,
              nombre: cs.servicio.nombre,
              tipo: cs.servicio.descripcion,
              precio: cs.servicio.precio,
            },
            fechaContratacion: cs.fechaInicio,
          })),
      };

      return clienteEjemplo;
    } catch (error) {
      console.error('Error al obtener el cliente:', error);
      throw new Error('No se pudo obtener el cliente');
    }
  }

  async findCustomersToTicket() {
    try {
      const customers = await this.prisma.clienteInternet.findMany({
        where: { isEliminado: false },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
        },
      });

      const customersSet = customers.map((c) => ({
        id: c.id,
        nombre: `${c.nombre} ${c.apellidos}`,
      }));
      return customersSet;
    } catch (error) {
      console.log(error);
    }
  }

  async getCustomersWhatsappCampaing(dto: CustomersCampaingQuery) {
    try {
      const {
        departamento,
        estado,
        estadoCobranza,
        municipio,
        nombre,
        numeroFact,
        sector,
        zonaF,
      } = dto;

      const where: Prisma.ClienteInternetWhereInput = {
        isEliminado: false,
      };

      if (departamento) {
        where.departamentoId = departamento;
      }

      if (sector) {
        where.sectorId = sector;
      }

      if (estado) {
        where.estadoCliente = estado;
      }

      if (estadoCobranza) {
        where.estadoCobranza = estadoCobranza;
      }

      if (municipio) {
        where.municipioId = municipio;
      }

      if (zonaF) {
        where.facturacionZonaId = zonaF;
      }

      if (nombre?.trim()) {
        where.searchNombre = {
          contains: nombre.trim(),
          mode: 'insensitive',
        };
      }

      if (numeroFact !== undefined && numeroFact !== null) {
        const clientesConFacturasPendientes =
          await this.prisma.facturaInternet.groupBy({
            by: ['clienteId'],
            where: {
              estadoFacturaInternet: 'PENDIENTE',
            },
            _count: {
              id: true,
            },
            having: {
              id: {
                _count: {
                  equals: numeroFact,
                },
              },
            },
          });

        const clienteIds = clientesConFacturasPendientes.map(
          (item) => item.clienteId,
        );

        where.id = {
          in: clienteIds,
        };
      }

      this.logger.log(
        `El where construido:\n${JSON.stringify(where, null, 2)}`,
      );

      const records = await this.prisma.clienteInternet.findMany({
        where,
        select: selectCustomerCampaignWhatsapp,
      });

      return mapCustomersCampaingWhatsapp(records);
    } catch (error) {
      throw error;
    }
  }

  async getCustomersToRuta(q: GetClientesRutaQueryDto) {
    try {
      const {
        empresaId,
        sortBy = 'nombre',
        page = 1,
        perPage = 10,
        sortDir = 'asc',
        estado,
        search,
        zonaIds,
        sectorIds,
        estadoCobranza,
      } = q;

      /*
       * Los arrays ya deberían venir transformados por el DTO,
       * pero aquí eliminamos valores inválidos y duplicados.
       */
      const zonas = Array.from(
        new Set((zonaIds ?? []).filter((id) => Number.isInteger(id) && id > 0)),
      );

      const sectores = Array.from(
        new Set(
          (sectorIds ?? []).filter((id) => Number.isInteger(id) && id > 0),
        ),
      );

      /*
       * Debe utilizar exactamente la misma normalización que se usa
       * cuando se genera ClienteInternet.searchNombre.
       *
       * No tokenizamos. Se busca el texto completo con contains.
       */
      const normalizedSearch = strip(search ?? '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');

      /*
       * Una sola fuente de verdad para todos los filtros.
       *
       * Este where se usa tanto para count como para findMany,
       * evitando que la paginación se calcule con filtros distintos.
       */
      const where: Prisma.ClienteInternetWhereInput = {
        isEliminado: false,

        ...(empresaId
          ? {
              empresaId,
            }
          : {}),

        ...(estado
          ? {
              estadoCliente: estado,
            }
          : {}),

        ...(estadoCobranza
          ? {
              estadoCobranza,
            }
          : {}),

        ...(zonas.length > 0
          ? {
              facturacionZonaId: {
                in: zonas,
              },
            }
          : {}),

        ...(sectores.length > 0
          ? {
              sectorId: {
                in: sectores,
              },
            }
          : {}),

        ...(normalizedSearch
          ? {
              searchNombre: {
                contains: normalizedSearch,
              },
            }
          : {}),
      };

      /*
       * Ordenamiento remoto real.
       *
       * Prisma aplica orderBy antes de skip/take, por lo que las páginas
       * representan correctamente el orden global.
       *
       * id se utiliza como desempate para evitar cambios de posición
       * cuando varios clientes tienen el mismo nombre o saldo.
       */
      const orderBy: Prisma.ClienteInternetOrderByWithRelationInput[] =
        sortBy === 'saldo'
          ? [
              {
                saldoCliente: {
                  saldoPendiente: sortDir,
                },
              },
              {
                id: 'asc',
              },
            ]
          : [
              {
                nombre: sortDir,
              },
              {
                apellidos: sortDir,
              },
              {
                id: 'asc',
              },
            ];

      const skip = (page - 1) * perPage;

      /*
       * Count y página usan exactamente los mismos filtros.
       */
      const [count, rows] = await this.prisma.$transaction([
        this.prisma.clienteInternet.count({
          where,
        }),

        this.prisma.clienteInternet.findMany({
          where,
          orderBy,
          skip,
          take: perPage,

          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            direccion: true,
            estadoCliente: true,
            estadoCobranza: true,

            saldoCliente: {
              select: {
                saldoPendiente: true,
              },
            },

            municipio: {
              select: {
                id: true,
                nombre: true,
              },
            },

            sector: {
              select: {
                id: true,
                nombre: true,
              },
            },

            facturacionZona: {
              select: {
                id: true,
                nombre: true,
              },
            },

            facturaInternet: {
              where: {
                estadoFacturaInternet: {
                  in: ['PARCIAL', 'PENDIENTE', 'VENCIDA'],
                },
              },

              select: {
                id: true,
                fechaPagoEsperada: true,
                montoPago: true,
              },
            },
          },
        }),
      ]);

      const items = rows.map((cliente) => ({
        id: cliente.id,
        nombre: cliente.nombre,
        apellidos: cliente.apellidos ?? '',
        telefono: cliente.telefono ?? null,
        direccion: cliente.direccion ?? null,

        estadoCliente: cliente.estadoCliente,
        estadoCobranza: cliente.estadoCobranza,

        saldoPendiente: Number(cliente.saldoCliente?.saldoPendiente ?? 0),

        facturacionZona: cliente.facturacionZona?.id ?? null,

        zonaFacturacion: cliente.facturacionZona?.nombre ?? '',

        facturasPendientes: cliente.facturaInternet.length,

        sector: {
          id: cliente.sector?.id ?? null,
          nombre: cliente.sector?.nombre ?? '',
        },

        municipio: {
          id: cliente.municipio?.id ?? null,
          nombre: cliente.municipio?.nombre ?? '',
        },

        facturas: cliente.facturaInternet.map((factura) => ({
          id: factura.id,

          montoFactura: Number(factura.montoPago ?? 0),

          fechaPagoEsperada: factura.fechaPagoEsperada,
        })),
      }));

      this.logger.log(
        `Clientes para ruta: ${JSON.stringify(
          {
            filtros: {
              empresaId,
              estado,
              estadoCobranza,
              search: normalizedSearch || undefined,
              zonaIds: zonas,
              sectorIds: sectores,
              sortBy,
              sortDir,
              page,
              perPage,
            },
            resultado: {
              total: count,
              itemsPagina: items.length,
            },
          },
          null,
          2,
        )}`,
      );

      return {
        items,
        total: count,
        page,
        perPage,
      };
    } catch (error) {
      this.logger.error(
        'Error generado al obtener clientes para ruta',
        error instanceof Error ? error.stack : String(error),
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Fatal error: Error inesperado en clientes ruta',
      );
    }
  }

  // Función auxiliar para quitar tildes y caracteres especiales (puedes ponerla fuera de la clase o como método privado)
  private normalizeString(str: string): string {
    return str
      .normalize('NFD') // separa letra y tilde
      .replace(/[\u0300-\u036f]/g, '') // quita tildes
      .toLowerCase() // minúsculas
      .replace(/\s+/g, ' ') // colapsa espacios múltiples
      .trim(); // recorta
  }

  async findCustomersToTable(dto: GetCustomersQueryDto) {
    const {
      depaSelected,
      estadoSelected,
      limite,
      muniSelected,
      page,
      paramSearch,
      sectorSelected,
      zonasFacturacionSelected,
      estadoCobranzaSelected,
    } = dto;

    const skip = (page - 1) * limite;

    // Preparar términos de búsqueda
    let terms: string[] = [];

    if (paramSearch && paramSearch.trim() !== '') {
      const cleanSearch = this.normalizeString(paramSearch);

      terms = cleanSearch
        .split(/\s+/) // Divide por espacios
        .filter((t) => t.length > 0);
    }

    //Construir condiciones dinámicas
    const andConditions: Prisma.ClienteInternetWhereInput[] = [
      { isEliminado: false },
    ];

    for (const term of terms) {
      andConditions.push({
        OR: [
          { searchNombre: { contains: term, mode: 'insensitive' } },
          { telefono: { contains: term, mode: 'insensitive' } },
          { IP: { direccionIp: { contains: term, mode: 'insensitive' } } },
          {
            sector: {
              nombre: {
                contains: term,
                mode: 'insensitive',
              },
            },
          },
          {
            direccion: {
              contains: term,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    // Filtros exactos
    if (zonasFacturacionSelected)
      andConditions.push({ facturacionZonaId: zonasFacturacionSelected });
    if (muniSelected) andConditions.push({ municipioId: muniSelected });
    if (depaSelected) andConditions.push({ departamentoId: depaSelected });
    if (sectorSelected) andConditions.push({ sectorId: sectorSelected });
    if (estadoSelected) {
      andConditions.push({ estadoCliente: estadoSelected as EstadoCliente });
    }
    if (estadoCobranzaSelected)
      andConditions.push({
        estadoCobranza: estadoCobranzaSelected as EstadoCobranzaCliente,
      });

    const whereCondition: Prisma.ClienteInternetWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [customers, totalCount, activo, pendiente_activo, atrasado, moroso] =
      await this.prisma.$transaction([
        this.prisma.clienteInternet.findMany({
          skip,
          take: limite,
          orderBy: {
            creadoEn: 'desc',
          },
          where: whereCondition,
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            dpi: true,
            direccion: true,
            creadoEn: true,
            actualizadoEn: true,
            estadoCliente: true,
            estadoCobranza: true,
            sector: {
              select: {
                id: true,
                nombre: true,
              },
            },
            servicioInternet: {
              select: {
                id: true,
                nombre: true,
                velocidad: true,
                precio: true,
                estado: true,
                actualizadoEn: true,
              },
            },
            departamento: {
              select: {
                id: true,
                nombre: true,
              },
            },
            municipio: {
              select: {
                id: true,
                nombre: true,
              },
            },
            IP: {
              select: {
                id: true,
                direccionIp: true,
              },
            },
            facturacionZona: {
              select: {
                id: true,
                nombre: true,
              },
            },
            facturaInternet: {
              select: {
                id: true,
                estadoFacturaInternet: true,
                creadoEn: true,
                fechaPagoEsperada: true,
                fechaPagada: true,
                pagos: {
                  where: {},
                  select: {
                    id: true,
                    fechaPago: true,
                    montoPagado: true,
                  },
                },
              },
            },
          },
        }),

        this.prisma.clienteInternet.count({
          where: whereCondition,
        }),

        this.prisma.clienteInternet.count({
          where: {
            isEliminado: false,
            estadoCliente: 'ACTIVO',
          },
        }),

        this.prisma.clienteInternet.count({
          where: conCobranza('PAGO_PENDIENTE'),
        }),

        this.prisma.clienteInternet.count({
          where: conCobranza('ATRASADO'),
        }),

        this.prisma.clienteInternet.count({
          where: conCobranza('MOROSO'),
        }),
      ]);

    const formattedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const historial = await this.verifyCreditService.calculatePenality(
          customer.facturaInternet,
        );
        const result =
          await this.verifyCreditService.generarResultado(historial);

        return {
          id: customer.id,
          nombreCompleto: `${customer.nombre} ${customer.apellidos}`,
          estado: customer.estadoCliente,
          estadoCobranza: customer.estadoCobranza,
          telefono: customer.telefono,
          dpi: customer.dpi,
          direccion: customer.direccion,
          creadoEn: customer.creadoEn,
          actualizadoEn: customer.actualizadoEn,
          departamento: customer.departamento?.nombre || 'No disponible',
          municipio: customer.municipio?.nombre || 'No disponible',
          direccionIp: customer.IP?.direccionIp || 'No disponible',
          municipioId: customer.municipio.id,
          sector: customer.sector || null,
          sectorId: customer.sector ? customer.sector.id : null,
          departamentoId: customer.departamento.id,
          clasificacionCredito: result,
          servicios: customer.servicioInternet
            ? [
                {
                  id: customer.servicioInternet.id,
                  nombre: customer.servicioInternet.nombre,
                  velocidad: customer.servicioInternet.velocidad,
                  precio: customer.servicioInternet.precio,
                  estado: customer.servicioInternet.estado,
                  creadoEn: customer.servicioInternet.actualizadoEn,
                  actualizadoEn: customer.servicioInternet.actualizadoEn,
                },
              ]
            : [],
          facturacionZona: customer.facturacionZona?.nombre || 'Sin zona',
          facturacionZonaId:
            customer.facturacionZona?.id || 'Sin zona facturacion id',
        };
      }),
    );

    return {
      data: formattedCustomers,
      totalCount,
      summary: {
        activo,
        moroso,
        pendiente_activo,
        atrasado,
      },
    };
  }

  //SERVICE QUE RETORNA TODOS LOS DETALLES DEL CLIENTE A LA INTERFAZ

  // Obtener un cliente con todas sus relaciones
  async getDetallesClienteInternet(clienteInternetId: number) {
    try {
      const clienteInternetWithRelations =
        await this.prisma.clienteInternet.findUnique({
          where: {
            id: clienteInternetId,
          },
          include: {
            asesor: { select: { id: true, nombre: true } }, // Asesor que asignó el servicio
            municipio: { select: { id: true, nombre: true } }, // Municipio del cliente
            departamento: { select: { id: true, nombre: true } }, // Departamento del cliente
            empresa: { select: { id: true, nombre: true } }, // Empresa del cliente
            IP: { select: { id: true, direccionIp: true } }, // IP del cliente
            ubicacion: { select: { id: true, latitud: true, longitud: true } }, // Ubicación
            saldoCliente: {
              select: { id: true, saldoFavor: true, saldoPendiente: true },
            }, // Saldo y último pago
            ticketSoporte: {
              select: {
                id: true,
                titulo: true,
                estado: true,
                prioridad: true,
                fechaApertura: true,
                fechaCierre: true,
              },
            },
            facturaInternet: {
              select: {
                id: true,
                montoPago: true,
                creadoEn: true,
                fechaPagoEsperada: true,
                saldoPendiente: true,
                estadoFacturaInternet: true,
              },
            },
            clienteServicios: {
              include: {
                servicio: {
                  select: {
                    id: true,
                    nombre: true,
                    precio: true,
                    descripcion: true,
                  },
                },
              },
            },
            // Relación 1:1 con ServicioInternet
            servicioInternet: {
              select: {
                id: true,
                nombre: true,
                velocidad: true,
                precio: true,
              },
            },
          },
        });

      if (!clienteInternetWithRelations) {
        throw new Error('Cliente no encontrado');
      }

      // Formatear la respuesta al formato requerido
      const clienteEjemplo = {
        id: clienteInternetWithRelations.id,
        nombre: clienteInternetWithRelations.nombre,
        apellidos: clienteInternetWithRelations.apellidos,
        telefono: clienteInternetWithRelations.telefono,
        direccion: clienteInternetWithRelations.direccion,
        dpi: clienteInternetWithRelations.dpi,
        observaciones: clienteInternetWithRelations.observaciones,
        contactoReferenciaNombre:
          clienteInternetWithRelations.contactoReferenciaNombre,
        contactoReferenciaTelefono:
          clienteInternetWithRelations.contactoReferenciaTelefono,
        estadoCliente: clienteInternetWithRelations.estadoCliente,
        contrasenaWifi: clienteInternetWithRelations.contrasenaWifi,
        ssidRouter: clienteInternetWithRelations.ssidRouter,
        fechaInstalacion: clienteInternetWithRelations.fechaInstalacion,
        asesor: clienteInternetWithRelations.asesor
          ? {
              id: clienteInternetWithRelations.asesor.id,
              nombre: clienteInternetWithRelations.asesor.nombre,
            }
          : null,
        // Relación 1:1 con servicio de internet
        servicio: clienteInternetWithRelations.servicioInternet
          ? {
              id: clienteInternetWithRelations.servicioInternet.id,
              nombre: clienteInternetWithRelations.servicioInternet.nombre,
              precio: clienteInternetWithRelations.servicioInternet.precio,
              velocidad:
                clienteInternetWithRelations.servicioInternet.velocidad,
            }
          : null,
        municipio: clienteInternetWithRelations.municipio
          ? {
              id: clienteInternetWithRelations.municipio.id,
              nombre: clienteInternetWithRelations.municipio.nombre,
            }
          : null,
        departamento: clienteInternetWithRelations.departamento
          ? {
              id: clienteInternetWithRelations.departamento.id,
              nombre: clienteInternetWithRelations.departamento.nombre,
            }
          : null,
        empresa: clienteInternetWithRelations.empresa
          ? {
              id: clienteInternetWithRelations.empresa.id,
              nombre: clienteInternetWithRelations.empresa.nombre,
            }
          : null,
        IP: clienteInternetWithRelations.IP
          ? {
              id: clienteInternetWithRelations.IP.id,
              direccion: clienteInternetWithRelations.IP.direccionIp,
              mascara: '255.255.255.0', // Ejemplo de máscara de red
              gateway: '192.168.1.1', // Ejemplo de gateway
            }
          : null,
        ubicacion: clienteInternetWithRelations.ubicacion
          ? {
              id: clienteInternetWithRelations.ubicacion.id,
              latitud: clienteInternetWithRelations.ubicacion.latitud,
              longitud: clienteInternetWithRelations.ubicacion.longitud,
            }
          : null,
        saldoCliente: clienteInternetWithRelations.saldoCliente
          ? {
              id: clienteInternetWithRelations.saldoCliente.id,
              saldo: clienteInternetWithRelations.saldoCliente.saldoFavor, // Usando saldoFavor aquí
              ultimoPago:
                clienteInternetWithRelations.saldoCliente.saldoPendiente, // Suponiendo saldoPendiente como último pago
            }
          : null,
        creadoEn: clienteInternetWithRelations.creadoEn,
        actualizadoEn: clienteInternetWithRelations.actualizadoEn,
        ticketSoporte: clienteInternetWithRelations.ticketSoporte.map(
          (ticket) => ({
            id: ticket.id,
            titulo: ticket.titulo,
            estado: ticket.estado,
            prioridad: ticket.prioridad,
            fechaApertura: ticket.fechaApertura,
            fechaCierre: ticket.fechaCierre,
          }),
        ),
        facturaInternet: clienteInternetWithRelations.facturaInternet.map(
          (factura) => ({
            id: factura.id,
            monto: factura.montoPago,
            fechaEmision: factura.creadoEn,
            fechaVencimiento: factura.fechaPagoEsperada,
            pagada: factura.estadoFacturaInternet === 'PAGADA' ? true : false,
          }),
        ),
        clienteServicio: clienteInternetWithRelations.clienteServicios.map(
          (cs) => ({
            id: cs.id,
            servicio: {
              id: cs.servicio.id,
              nombre: cs.servicio.nombre,
              tipo: cs.servicio.descripcion, // Asumí que 'descripcion' es el tipo
            },
            fechaContratacion: cs.fechaInicio,
          }),
        ),
      };

      return clienteEjemplo;
    } catch (error) {
      console.error('Error al obtener el cliente:', error);
      throw new Error('No se pudo obtener el cliente');
    }
  }

  async getCustomerToEdit(clienteInternetId: number) {
    try {
      const customer = await this.prisma.clienteInternet.findUnique({
        where: { id: clienteInternetId },
        include: {
          IP: true,
          ubicacion: true,
          municipio: true,
          sector: true,
          departamento: true,
          servicioInternet: true,
          clienteServicios: {
            include: { servicio: true },
          },
          medias: {
            select: {
              id: true,
              titulo: true,
              descripcion: true,
              cdnUrl: true,
              categoria: true,
              estado: true,
              etiqueta: true,
            },
          },
          facturacionZona: true,
          ContratoFisico: {
            select: {
              idContrato: true,
              fechaFirma: true,
              archivoContrato: true,
              observaciones: true,
            },
          },
          MikrotikRouter: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      if (!customer) throw new Error('Cliente no encontrado');

      return {
        id: customer.id,
        nombre: customer.nombre,
        apellidos: customer.apellidos,
        telefono: customer.telefono,
        direccion: customer.direccion,
        dpi: customer.dpi,
        enviarRecordatorio: customer.enviarRecordatorio,
        observaciones: customer.observaciones,
        contactoReferenciaNombre: customer.contactoReferenciaNombre,
        contactoReferenciaTelefono: customer.contactoReferenciaTelefono,
        estado: customer.estadoCliente,
        estadoCobranza: customer.estadoCobranza,

        coordenadas: customer.ubicacion
          ? [`${customer.ubicacion.latitud}`, `${customer.ubicacion.longitud}`]
          : [],
        ip: customer.IP?.direccionIp || '',
        gateway: customer.IP?.gateway || '',
        mascara: customer.IP?.mascara || '',
        contrasenaWifi: customer.contrasenaWifi,
        ssidRouter: customer.ssidRouter,
        fechaInstalacion: customer.fechaInstalacion,
        departamento: customer.departamento,
        municipio: customer.municipio,

        imagenes:
          customer.medias.length > 0
            ? customer.medias.map((img) => ({
                id: img.id,
                categoria: img.categoria ?? CategoriaMedia.CLIENTE_GENERAL,
                cdnUrl: img.cdnUrl ?? '',
                descripcion: img.descripcion ?? '',
                estado: img.estado ?? EstadoMedia.LISTO,
                etiqueta: img.etiqueta ?? '',
                titulo: img.titulo ?? '',
                customerId: customer.id,
              }))
            : [],

        servicios: customer.clienteServicios.map((s) => ({
          id: s.servicio.id,
          nombre: s.servicio.nombre,
        })),
        zonaFacturacion: customer.facturacionZona
          ? {
              id: customer.facturacionZona.id,
              nombre: customer.facturacionZona.nombre,
            }
          : null,
        sector: customer.sector
          ? { id: customer.sector.id, nombre: customer.sector.nombre }
          : null,
        servicioWifi: customer.servicioInternet
          ? {
              id: customer.servicioInternet.id,
              nombre: customer.servicioInternet.nombre,
              velocidad: customer.servicioInternet.velocidad,
            }
          : null,
        contrato: customer.ContratoFisico
          ? {
              idContrato: customer.ContratoFisico.idContrato,
              fechaFirma: customer.ContratoFisico.fechaFirma,
              archivoContrato: customer.ContratoFisico.archivoContrato,
              observaciones: customer.ContratoFisico.observaciones,
            }
          : null,
        mikrotik: customer.MikrotikRouter
          ? {
              id: customer.MikrotikRouter.id,
              nombre: customer.MikrotikRouter.nombre,
            }
          : null,
      };
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      throw new Error('No se pudo obtener la información del cliente.');
    }
  }
}
