import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateClienteInternetDto } from './dto/create-cliente-internet.dto';
import { UpdateClienteInternetDto } from './dto/update-cliente-internet.dto';
import { UserTokenAuth } from 'src/auth/dto/userToken.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { updateCustomerService } from './dto/update-customer-service';
import { ClienteInternet } from '@prisma/client';
import * as dayjs from 'dayjs';
import { IdContratoService } from 'src/id-contrato/id-contrato.service';
import { DeleteClienteInternetDto } from './dto/DeleteClienteInternetDto .dto';

const formatearFecha = (fecha: string) => {
  // Formateo en UTC sin conversión a local
  return dayjs(fecha).format('DD/MM/YYYY');
};

@Injectable()
export class ClienteInternetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idContradoService: IdContratoService,
  ) {}

  // async create(createClienteInternetDto: CreateClienteInternetDto) {
  //   const {
  //     coordenadas,
  //     municipioId,
  //     departamentoId,
  //     empresaId,
  //     servicesIds,
  //     asesorId,
  //     ip,
  //     mascara,
  //     gateway,
  //     servicioWifiId, // Ahora usamos directamente este ID para la relación 1:1
  //     zonaFacturacionId,
  //     //
  //     archivoContrato,
  //     fechaFirma,
  //     idContrato,
  //     observacionesContrato,
  //     ...restoData
  //   } = createClienteInternetDto;

  //   if (!coordenadas || coordenadas.length !== 2) {
  //     throw new Error('Coordenadas inválidas');
  //   }

  //   const serviceIds: number[] = createClienteInternetDto.servicesIds;
  //   const latitud = Number(coordenadas[0]);
  //   const longitud = Number(coordenadas[1]);

  //   const result = await this.prisma.$transaction(async (prisma) => {
  //     const ubicacion = await prisma.ubicacion.create({
  //       data: {
  //         latitud,
  //         longitud,
  //         empresa: {
  //           connect: { id: 1 },
  //         },
  //       },
  //     });

  //     // Crear cliente con la nueva relación 1:1
  //     const cliente = await prisma.clienteInternet.create({
  //       data: {
  //         ...restoData,
  //         // NUEVA RELACIÓN 1:1 DIRECTA
  //         servicioInternet: servicioWifiId
  //           ? { connect: { id: servicioWifiId } }
  //           : undefined,

  //         // Mantenemos relaciones existentes
  //         municipio: municipioId ? { connect: { id: municipioId } } : undefined,
  //         departamento: departamentoId
  //           ? { connect: { id: departamentoId } }
  //           : undefined,
  //         empresa: { connect: { id: empresaId } },

  //         // [MANTENEMOS SERVICIOS NO WIFI]
  //         clienteServicios: {
  //           create: serviceIds.map((id) => ({
  //             servicio: { connect: { id } },
  //             fechaInicio: createClienteInternetDto.fechaInstalacion,
  //             estado: 'ACTIVO',
  //           })),
  //         },

  //         asesor: asesorId ? { connect: { id: asesorId } } : undefined,
  //         ubicacion: { connect: { id: ubicacion.id } },
  //         apellidos: restoData.apellidos || null,
  //         telefono: restoData.telefono || null,
  //         direccion: restoData.direccion || null,
  //         dpi: restoData.dpi || null,
  //         observaciones: restoData.observaciones || null,
  //         contactoReferenciaNombre: restoData.contactoReferenciaNombre || null,
  //         contactoReferenciaTelefono:
  //           restoData.contactoReferenciaTelefono || null,
  //         ssidRouter: restoData.ssidRouter || null,
  //         fechaInstalacion: restoData.fechaInstalacion || null,
  //         estadoCliente: 'ACTIVO',
  //         facturacionZona: {
  //           connect: {
  //             id: zonaFacturacionId,
  //           },
  //         },
  //       },
  //     });

  //     // Actualizar ubicación con el clienteId
  //     await prisma.ubicacion.update({
  //       where: { id: ubicacion.id },
  //       data: { clienteId: cliente.id },
  //     });

  //     // Crear IP usando el clienteId
  //     const ipRecord = await prisma.iP.create({
  //       data: {
  //         direccionIp: ip,
  //         gateway: gateway,
  //         mascara: mascara,
  //         cliente: { connect: { id: cliente.id } },
  //       },
  //     });

  //     const saldoClienteInternet = await prisma.saldoCliente.create({
  //       data: {
  //         cliente: {
  //           connect: {
  //             id: cliente.id,
  //           },
  //         },
  //       },
  //     });
  //     console.log('El saldo del cliente creado es: ', saldoClienteInternet);

  //     console.log('================CLIENTE NUEVO===========');
  //     console.log(cliente);

  //     console.log('==================EMPEZANDO FACTURACION=========');

  //     const fechaFacturacionZona = await prisma.facturacionZona.findUnique({
  //       where: {
  //         id: createClienteInternetDto.zonaFacturacionId,
  //       },
  //     });

  //     // Verificamos que el servicio existe
  //     const servicioClienteInternet = await prisma.servicioInternet.findUnique({
  //       where: {
  //         id: servicioWifiId, // Usamos directamente el ID del servicio
  //       },
  //     });

  //     if (!servicioClienteInternet) {
  //       throw new Error('Servicio de internet no encontrado');
  //     }

  //     console.log('La zona de facturacion es: ', fechaFacturacionZona);
  //     const fechaPrimerPago = fechaFacturacionZona.diaPago;

  //     const fechaPrimerPagoInicial = dayjs().date(fechaPrimerPago);
  //     console.log(
  //       'La fecha inicial a pagar es: ',
  //       fechaPrimerPagoInicial.format('YYYY-MM-DD'),
  //     );

  //     const siguientePago = fechaPrimerPagoInicial.add(1, 'month');
  //     console.log(
  //       'El siguiente pago el día: ',
  //       siguientePago.format('YYYY-MM-DD'),
  //     );

  //     const newFacturaInternetPrimerPago = await prisma.facturaInternet.create({
  //       data: {
  //         fechaPagoEsperada: fechaPrimerPagoInicial.toDate(),
  //         montoPago: servicioClienteInternet.precio,
  //         saldoPendiente: servicioClienteInternet.precio,
  //         empresa: {
  //           connect: {
  //             id: createClienteInternetDto.empresaId,
  //           },
  //         },
  //         estadoFacturaInternet: 'PENDIENTE',
  //         cliente: {
  //           connect: {
  //             id: cliente.id,
  //           },
  //         },
  //         facturacionZona: {
  //           connect: {
  //             id: fechaFacturacionZona.id,
  //           },
  //         },
  //         nombreClienteFactura: `${cliente.nombre}  ${cliente.apellidos}`,
  //         detalleFactura: `Pago por suscripción mensual al servicio de internet, plan ${servicioClienteInternet.nombre} (${servicioClienteInternet.velocidad}), precio: ${servicioClienteInternet.precio} Fecha: ${fechaPrimerPagoInicial}`,
  //       },
  //     });

  //     const recordatorioPrimerPago = await prisma.recordatorioPago.create({
  //       data: {
  //         cliente: {
  //           connect: {
  //             id: cliente.id,
  //           },
  //         },
  //         facturaInternet: {
  //           connect: {
  //             id: newFacturaInternetPrimerPago.id,
  //           },
  //         },
  //         tipo: 'Sistema Auto',
  //         mensaje: 'Recordatorio de primer pago de servicio',
  //         fechaEnviado: fechaPrimerPagoInicial.toDate(),
  //         resultado: 'PENDIENTE',
  //       },
  //     });

  //     return {
  //       cliente,
  //       ubicacion,
  //       ip: ipRecord,
  //       newFacturaInternetPrimerPago,
  //     };
  //   });

  //   if (createClienteInternetDto.idContrato) {
  //     const clienteConcontratro = await this.idContradoService.create({
  //       archivoContrato: archivoContrato,
  //       clienteId: result.cliente.id,
  //       fechaFirma: fechaFirma,
  //       idContrato: idContrato,
  //       observaciones: observacionesContrato,
  //     });
  //     console.log('el contrato del cliente es: ', clienteConcontratro);
  //   }

  //   return result;
  // }

  async create(createClienteInternetDto: CreateClienteInternetDto) {
    const {
      coordenadas,
      municipioId,
      departamentoId,
      empresaId,
      servicesIds,
      asesorId,
      ip,
      mascara,
      gateway,
      servicioWifiId,
      zonaFacturacionId,
      archivoContrato,
      fechaFirma,
      idContrato,
      observacionesContrato,
      ...restoData
    } = createClienteInternetDto;

    const serviceIds: number[] = createClienteInternetDto.servicesIds;
    const latitud = coordenadas?.[0] ? Number(coordenadas[0]) : null;
    const longitud = coordenadas?.[1] ? Number(coordenadas[1]) : null;

    const result = await this.prisma.$transaction(async (prisma) => {
      let ubicacion = null;

      // Si hay coordenadas válidas, se crea la ubicación
      if (latitud !== null && longitud !== null) {
        ubicacion = await prisma.ubicacion.create({
          data: {
            latitud,
            longitud,
            empresa: {
              connect: { id: 1 },
            },
          },
        });
      }

      const cliente = await prisma.clienteInternet.create({
        data: {
          ...restoData,
          servicioInternet: servicioWifiId
            ? { connect: { id: servicioWifiId } }
            : undefined,
          municipio: municipioId ? { connect: { id: municipioId } } : undefined,
          departamento: departamentoId
            ? { connect: { id: departamentoId } }
            : undefined,
          empresa: { connect: { id: empresaId } },
          clienteServicios: {
            create: serviceIds.map((id) => ({
              servicio: { connect: { id } },
              fechaInicio: createClienteInternetDto.fechaInstalacion,
              estado: 'ACTIVO',
            })),
          },
          asesor: asesorId ? { connect: { id: asesorId } } : undefined,
          ubicacion: ubicacion ? { connect: { id: ubicacion.id } } : undefined,
          apellidos: restoData.apellidos || null,
          telefono: restoData.telefono || null,
          direccion: restoData.direccion || null,
          dpi: restoData.dpi || null,
          observaciones: restoData.observaciones || null,
          contactoReferenciaNombre: restoData.contactoReferenciaNombre || null,
          contactoReferenciaTelefono:
            restoData.contactoReferenciaTelefono || null,
          ssidRouter: restoData.ssidRouter || null,
          fechaInstalacion: restoData.fechaInstalacion || null,
          estadoCliente: 'ACTIVO',
          facturacionZona: {
            connect: {
              id: zonaFacturacionId,
            },
          },
        },
      });

      // Solo se actualiza la ubicación si fue creada
      if (ubicacion) {
        await prisma.ubicacion.update({
          where: { id: ubicacion.id },
          data: { clienteId: cliente.id },
        });
      }

      const ipRecord = await prisma.iP.create({
        data: {
          direccionIp: ip,
          gateway: gateway,
          mascara: mascara,
          cliente: { connect: { id: cliente.id } },
        },
      });

      const saldoClienteInternet = await prisma.saldoCliente.create({
        data: {
          cliente: {
            connect: {
              id: cliente.id,
            },
          },
        },
      });

      const fechaFacturacionZona = await prisma.facturacionZona.findUnique({
        where: {
          id: createClienteInternetDto.zonaFacturacionId,
        },
      });

      const servicioClienteInternet = await prisma.servicioInternet.findUnique({
        where: {
          id: servicioWifiId,
        },
      });

      if (!servicioClienteInternet) {
        throw new Error('Servicio de internet no encontrado');
      }

      const fechaPrimerPago = fechaFacturacionZona.diaPago;
      const fechaPrimerPagoInicial = dayjs().date(fechaPrimerPago);
      const siguientePago = fechaPrimerPagoInicial.add(1, 'month');

      const newFacturaInternetPrimerPago = await prisma.facturaInternet.create({
        data: {
          fechaPagoEsperada: fechaPrimerPagoInicial.toDate(),
          montoPago: servicioClienteInternet.precio,
          saldoPendiente: servicioClienteInternet.precio,
          empresa: {
            connect: {
              id: createClienteInternetDto.empresaId,
            },
          },
          estadoFacturaInternet: 'PENDIENTE',
          cliente: {
            connect: {
              id: cliente.id,
            },
          },
          facturacionZona: {
            connect: {
              id: fechaFacturacionZona.id,
            },
          },
          nombreClienteFactura: `${cliente.nombre}  ${cliente.apellidos}`,
          detalleFactura: `Pago por suscripción mensual al servicio de internet, plan ${servicioClienteInternet.nombre} (${servicioClienteInternet.velocidad}), precio: ${servicioClienteInternet.precio} Fecha: ${formatearFecha(fechaPrimerPagoInicial.format())}`,
        },
      });

      //ponerle el sado pendiente de la primera factura:

      const nuevoSaldoCliente = await prisma.saldoCliente.update({
        where: {
          clienteId: cliente.id,
        },
        data: {
          saldoPendiente: {
            increment: newFacturaInternetPrimerPago.montoPago,
          },
        },
      });
      console.log('EL saldo inicial del nuevo cliente es: ', nuevoSaldoCliente);

      const recordatorioPrimerPago = await prisma.recordatorioPago.create({
        data: {
          cliente: {
            connect: {
              id: cliente.id,
            },
          },
          facturaInternet: {
            connect: {
              id: newFacturaInternetPrimerPago.id,
            },
          },
          tipo: 'Sistema Auto',
          mensaje: 'Recordatorio de primer pago de servicio',
          fechaEnviado: fechaPrimerPagoInicial.toDate(),
          resultado: 'PENDIENTE',
        },
      });

      return {
        cliente,
        ubicacion,
        ip: ipRecord,
        newFacturaInternetPrimerPago,
      };
    });

    if (createClienteInternetDto.idContrato) {
      const clienteConcontratro = await this.idContradoService.create({
        archivoContrato: archivoContrato,
        clienteId: result.cliente.id,
        fechaFirma: fechaFirma,
        idContrato: idContrato,
        observaciones: observacionesContrato,
      });
    }

    return result;
  }

  async updateClienteAddService(updateCustomerService: updateCustomerService) {
    console.log(
      'Entrando al servicio de actualizar con servicio',
      updateCustomerService,
    );

    return await this.prisma.$transaction(async (tx) => {
      const { customerId, serviceId } = updateCustomerService;

      // Verificar si el cliente existe
      const customer = await tx.clienteInternet.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new NotFoundException('Cliente no encontrado');
      }

      // Verificar si el servicio existe
      const service = await tx.servicio.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        throw new NotFoundException('Servicio no encontrado');
      }

      // ✅ Crear la relación en ClienteServicio (Tabla intermedia)
      const customerService = await tx.clienteServicio.create({
        data: {
          clienteId: customer.id,
          servicioId: service.id,
          fechaInicio: new Date(),
          estado: 'ACTIVO',
        },
      });

      return customerService;
    });
  }

  async findAllClientsWithRelations(): Promise<ClienteInternet[]> {
    return await this.prisma.clienteInternet.findMany({
      include: {
        // Relaciones de ubicación y organización
        municipio: true,
        departamento: true,
        empresa: true,
        ruta: true,
        ubicacion: true,

        // Otras relaciones del cliente
        IP: true,
        ticketSoporte: true,
        saldoCliente: true,
        fotos: true,
        facturacionZona: true,

        // Relación para servicios que no son de wifi
        clienteServicios: {
          include: {
            servicio: true,
          },
        },

        // Relación 1:1 para el servicio de wifi
        servicioInternet: {
          select: {
            id: true,
            nombre: true,
            velocidad: true,
            precio: true,
          },
        },

        // Relaciones de facturación
        facturaInternet: true,
        PagoFacturaInternet: true,
        factura: true,
        pagoFactura: true,
      },
    });
  }

  // Obtener un cliente con todas sus relaciones

  // Obtener un cliente con todas sus relaciones
  // Obtener un cliente con todas sus relaciones
  async getDetallesClienteInternet2(clienteInternetId: number) {
    try {
      const clienteInternetWithRelations =
        await this.prisma.clienteInternet.findUnique({
          where: { id: clienteInternetId },
          include: {
            asesor: { select: { id: true, nombre: true } },
            municipio: { select: { id: true, nombre: true } },
            departamento: { select: { id: true, nombre: true } },
            empresa: { select: { id: true, nombre: true } },
            IP: { select: { id: true, direccionIp: true } },
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
                pagos: {
                  select: {
                    id: true,
                    montoPagado: true,
                    metodoPago: true,
                    fechaPago: true,
                    cobrador: {
                      select: {
                        id: true,
                        nombre: true,
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

      console.log('El cliente encontrado es: ', clienteInternetWithRelations);

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
        contrasenaWifi: clienteInternetWithRelations.contrasenaWifi,
        ssidRouter: clienteInternetWithRelations.ssidRouter,
        fechaInstalacion: clienteInternetWithRelations.fechaInstalacion,
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
              saldo: clienteInternetWithRelations.saldoCliente.saldoFavor,
              saldoPendiente:
                clienteInternetWithRelations.saldoCliente.saldoPendiente,
              totalPagos: clienteInternetWithRelations.saldoCliente.totalPagos,
              ultimoPago: clienteInternetWithRelations.saldoCliente.ultimoPago,
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
            estado: factura.estadoFacturaInternet, //ESTADO DE LA FACTURA
            pagos: factura.pagos.map((pago) => ({
              fechaPago: pago.fechaPago,
              metodoPago: pago.metodoPago,
              montoPagado: pago.montoPagado,
              cobrador: {
                id: pago.cobrador.id,
                nombreCobrador: pago.cobrador.nombre,
              },
            })),
          }),
        ),
        clienteServicio: clienteInternetWithRelations.clienteServicios.map(
          (cs) => ({
            id: cs.id,
            servicio: {
              id: cs.servicio.id,
              nombre: cs.servicio.nombre,
              tipo: cs.servicio.descripcion, // Asumí que 'descripcion' es el tipo
              precio: cs.servicio.precio,
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

  async findCustomersToTicket() {
    try {
      const customers = await this.prisma.clienteInternet.findMany({
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

  async getCustomersToRuta() {
    try {
      const customers = await this.prisma.clienteInternet.findMany({
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          direccion: true,
          estadoCliente: true,
          saldoCliente: {
            select: {
              saldoPendiente: true, // Seleccionamos el saldo pendiente del cliente
            },
          },
          facturacionZona: {
            select: {
              id: true,
            },
          },
          facturaInternet: {
            // where: {
            //   estadoFacturaInternet: {
            //     not: 'PAGADA', // Solo clientes con facturas no pagadas
            //   },
            // },
            select: {
              id: true, // Seleccionamos el ID de las facturas pendientes
            },
          },
        },
      });

      // Mapeamos los datos de los clientes y formateamos la respuesta
      const customersSet = customers.map((c) => ({
        id: c.id,
        nombre: `${c.nombre} ${c.apellidos}`,
        telefono: c.telefono,
        direccion: c.direccion,
        estadoCliente: c.estadoCliente,
        saldoPendiente: c.saldoCliente.saldoPendiente,
        facturacionZona: c.facturacionZona.id,
        facturasPendientes: c.facturaInternet.length, // Contamos cuántas facturas pendientes tiene
      }));

      console.log('Los datos son: ', customersSet);

      return customersSet;
    } catch (error) {
      console.log(error);
      throw new Error('Error al obtener los clientes');
    }
  }

  async findAll() {
    try {
      return await this.prisma.clienteInternet.findMany({});
    } catch (error) {}
  }

  findOne(id: number) {
    return `This action returns a #${id} clienteInternet`;
  }

  async findCustomersToTable() {
    console.log('datos para la tabla');

    return await this.prisma.$transaction(async (tx) => {
      const customers = await tx.clienteInternet.findMany({
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          dpi: true,
          direccion: true,
          creadoEn: true,
          actualizadoEn: true,
          // Relación 1:1 con el servicio de internet
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
        },
      });

      // console.log(customers);

      if (!customers) {
        throw new NotFoundException(
          'Error al conseguir los registros de clientes',
        );
      }

      // Formatear la respuesta de clientes
      const formattedCustomers = customers.map((customer) => ({
        id: customer.id,
        nombreCompleto: `${customer.nombre} ${customer.apellidos}`,
        telefono: customer.telefono,
        dpi: customer.dpi,
        direccion: customer.direccion,
        creadoEn: customer.creadoEn,
        actualizadoEn: customer.actualizadoEn,
        departamento: customer.departamento.nombre,
        municipio: customer.municipio.nombre,
        direccionIp: customer.IP?.direccionIp || 'No disponible',
        // Servicios de internet (relación 1:1)
        servicios: customer.servicioInternet
          ? [
              {
                id: customer.servicioInternet.id,
                nombreServicio: customer.servicioInternet.nombre,
                velocidad: customer.servicioInternet.velocidad,
                precio: customer.servicioInternet.precio,
                estado: customer.servicioInternet.estado,
                creadoEn: customer.servicioInternet.actualizadoEn,
                actualizadoEn: customer.servicioInternet.actualizadoEn,
              },
            ]
          : [],
        facturacionZona: customer.facturacionZona.nombre,
      }));

      return formattedCustomers;
    });
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

  update(id: number, updateClienteInternetDto: UpdateClienteInternetDto) {
    return `This action updates a #${id} clienteInternet`;
  }

  remove(id: number) {
    return `This action removes a #${id} clienteInternet`;
  }

  async removeOneCustomer(id: number) {
    const clienteId = id;
    console.log('entrando a eliminar: ', id);

    return await this.prisma.$transaction(async (tx) => {
      // Verificamos si existe el cliente
      const cliente = await tx.clienteInternet.findUnique({
        where: { id: clienteId },
      });

      if (!cliente) {
        throw new InternalServerErrorException(
          `No se encontró un cliente con el id: ${clienteId}`,
        );
      }

      // 1. Eliminar recordatorios de pago relacionados
      await tx.recordatorioPago.deleteMany({
        where: { clienteId },
      });

      // 2. Eliminar facturas relacionadas
      await tx.facturaInternet.deleteMany({
        where: { clienteId },
      });

      // 3. Eliminar IP(s) asociada(s)
      await tx.iP.deleteMany({
        where: { clienteId },
      });

      // 4. Eliminar saldo del cliente
      await tx.saldoCliente.deleteMany({
        where: { clienteId },
      });

      // 5. Eliminar clienteServicios (servicios contratados)
      await tx.clienteServicio.deleteMany({
        where: { clienteId },
      });

      // 6. Eliminar posible contrato asociado
      // Ajusta el nombre de la tabla/servicio si es diferente
      await tx.contratoFisico.deleteMany({
        where: { clienteId },
      });

      // 7. Eliminar ubicación asociada
      await tx.ubicacion.deleteMany({
        where: { clienteId },
      });

      // 8. Finalmente, eliminar el cliente
      await tx.clienteInternet.delete({
        where: { id: clienteId },
      });

      return {
        message: `Cliente con id ${clienteId} y todas sus relaciones han sido eliminados correctamente.`,
      };
    });
  }

  async deleteClientsWithRelations() {
    try {
      return await this.prisma.clienteInternet.deleteMany({});
    } catch (error) {
      console.error('Error al eliminar los clientes y sus relaciones:', error);
      throw new Error('No se pudo eliminar a los clientes y sus relaciones');
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
          departamento: true,
          servicioInternet: true,
          clienteServicios: {
            include: {
              servicio: true,
            },
          },
          facturacionZona: true,
          ContratoFisico: true, // Incluye los datos del contrato si existe
        },
      });

      // Verifica si el cliente existe
      if (!customer) {
        throw new Error('Cliente no encontrado');
      }

      const dataToEdit = {
        id: customer.id,
        nombre: customer.nombre,
        apellidos: customer.apellidos,
        telefono: customer.telefono,
        direccion: customer.direccion,
        dpi: customer.dpi,
        observaciones: customer.observaciones,
        contactoReferenciaNombre: customer.contactoReferenciaNombre,
        contactoReferenciaTelefono: customer.contactoReferenciaTelefono,
        // coordenadas: `${customer.ubicacion.longitud} ${customer.ubicacion.latitud}`,
        coordenadas: customer.ubicacion
          ? [`${customer.ubicacion.longitud}`, `${customer.ubicacion.latitud}`]
          : [],

        ip: customer.IP.direccionIp,
        gateway: customer.IP.gateway,
        mascara: customer.IP.mascara,
        contrasenaWifi: customer.contrasenaWifi,
        ssidRouter: customer.ssidRouter,
        fechaInstalacion: customer.fechaInstalacion,
        departamento: customer.departamento,
        municipio: customer.municipio,
        servicios: customer.clienteServicios.map((s) => ({
          id: s.servicio.id,
          nombre: s.servicio.nombre,
        })),
        zonaFacturacion: {
          id: customer.facturacionZona.id,
          nombre: customer.facturacionZona.nombre,
          // velocidad: customer.facturacionZona.
        },
        servicioWifi: {
          id: customer.servicioInternet.id,
          nombre: customer.servicioInternet.nombre,
          velocidad: customer.servicioInternet.velocidad,
        },
        // Revisa si ContratoFisico existe antes de acceder a sus campos
        contrato: customer.ContratoFisico
          ? {
              idContrato: customer.ContratoFisico.idContrato,
              fechaFirma: customer.ContratoFisico.fechaFirma,
              archivoContrato: customer.ContratoFisico.archivoContrato,
              observaciones: customer.ContratoFisico.observaciones,
            }
          : null, // Si no existe, lo asigna como null
      };

      return dataToEdit;
    } catch (error) {
      console.error('Error al obtener los datos del cliente:', error);
      throw new Error('No se pudo obtener la información del cliente.');
    }
  }

  async updateClienteInternet(
    id: number,
    updateCustomerService: UpdateClienteInternetDto,
  ) {
    const {
      coordenadas,
      municipioId,
      departamentoId,
      empresaId,
      servicesIds,
      asesorId,
      ip,
      mascara,
      gateway,
      servicioWifiId,
      zonaFacturacionId,
      archivoContrato,
      fechaFirma,
      idContrato,
      observacionesContrato,
    } = updateCustomerService;

    // Validación de coordenadas
    if (!coordenadas || coordenadas.length !== 2) {
      throw new Error('Coordenadas inválidas');
    }

    const serviceIds: number[] = servicesIds;
    const latitud = Number(coordenadas[0]);
    const longitud = Number(coordenadas[1]);

    const result = await this.prisma.$transaction(async (prisma) => {
      const cliente = await prisma.clienteInternet.findUnique({
        where: { id: id },
      });

      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }

      // Actualizar ubicación
      const ubicacion = await prisma.ubicacion.upsert({
        where: { clienteId: id },
        update: { latitud, longitud },
        create: {
          latitud,
          longitud,
          empresa: { connect: { id: 1 } },
        },
      });

      // Actualizar cliente
      const updatedCliente = await prisma.clienteInternet.update({
        where: { id: id },
        data: {
          nombre: updateCustomerService.nombre,
          apellidos: updateCustomerService.apellidos || null,
          telefono: updateCustomerService.telefono || null,
          direccion: updateCustomerService.direccion || null,
          dpi: updateCustomerService.dpi || null,
          observaciones: updateCustomerService.observaciones || null,
          contactoReferenciaNombre:
            updateCustomerService.contactoReferenciaNombre || null,
          contactoReferenciaTelefono:
            updateCustomerService.contactoReferenciaTelefono || null,
          contrasenaWifi: updateCustomerService.contrasenaWifi,
          ssidRouter: updateCustomerService.ssidRouter,
          fechaInstalacion: updateCustomerService.fechaInstalacion || null,
          estadoCliente: 'ACTIVO',

          // Relaciones
          servicioInternet: servicioWifiId
            ? { connect: { id: servicioWifiId } }
            : undefined,
          municipio: municipioId ? { connect: { id: municipioId } } : undefined,
          departamento: departamentoId
            ? { connect: { id: departamentoId } }
            : undefined,
          empresa: { connect: { id: empresaId } },
          asesor: asesorId ? { connect: { id: asesorId } } : undefined,
          ubicacion: { connect: { id: ubicacion.id } },
          facturacionZona: { connect: { id: zonaFacturacionId } },

          // Servicios
          clienteServicios: {
            deleteMany: {},
            create: serviceIds.map((serviceId) => ({
              servicio: { connect: { id: serviceId } },
              fechaInicio: updateCustomerService.fechaInstalacion,
              estado: 'ACTIVO',
            })),
          },
        },
      });

      // Actualizar IP
      const ipRecord = await prisma.iP.upsert({
        where: { clienteId: id },
        update: { direccionIp: ip, gateway, mascara },
        create: {
          direccionIp: ip,
          gateway,
          mascara,
          cliente: { connect: { id: id } },
        },
      });

      // Actualizar contrato si existe
      if (idContrato) {
        await prisma.contratoFisico.update({
          where: { clienteId: id },
          data: {
            archivoContrato,
            fechaFirma: new Date(fechaFirma),
            idContrato,
            observaciones: observacionesContrato,
          },
        });
      }

      return {
        cliente: updatedCliente,
        ubicacion,
        ip: ipRecord,
      };
    });

    return result;
  }
}
