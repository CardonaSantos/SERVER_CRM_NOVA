import { Injectable } from '@nestjs/common';
import { CreateFacturacionDto } from './dto/create-facturacion.dto';
import { UpdateFacturacionDto } from './dto/update-facturacion.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFacturacionPaymentDto } from './dto/createFacturacionPayment.dto';
import { EstadoFacturaInternet, StateFacturaInternet } from '@prisma/client';
import * as dayjs from 'dayjs';

const formatearFecha = (fecha: string) => {
  // Formateo en UTC sin conversión a local
  return dayjs(fecha).format('DD/MM/YYYY');
};

type Factura = {
  id: number;
  metodo: string;
  cliente: string;
  cantidad: number;
  fechaCreado: string;
  por: string;
  telefono: number;
};

@Injectable()
export class FacturacionService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createFacturacionDto: CreateFacturacionDto) {}

  async findAll() {
    try {
      const facturas = await this.prisma.facturaInternet.findMany({
        select: {
          id: true,
          montoPago: true,
          saldoPendiente: true,
          // metodoPago: true,
          creadoEn: true,
          fechaPagoEsperada: true,
          estadoFacturaInternet: true,
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              direccion: true,
              dpi: true,
              estadoCliente: true,
              servicioInternet: {
                select: {
                  id: true,
                  nombre: true,
                  velocidad: true,
                  precio: true,
                },
              },
              facturacionZona: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              empresa: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },

          pagos: {
            select: {
              cobrador: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              montoPagado: true,
              fechaPago: true,
              creadoEn: true,
              metodoPago: true,
              cobradorId: true,
            },
          },
          RecordatorioPago: {
            select: {
              id: true,
              creadoEn: true,
              tipo: true,
            },
          },
        },
      });

      // Mapeamos los resultados para que coincidan con el tipo `FacturaInternet`
      const resultado = facturas.map((fac) => ({
        id: fac.id,
        fechaPagoEsperada: fac.fechaPagoEsperada?.toISOString() || null,
        fechaPagada: null, // Asumimos que aún no ha sido pagada, ajusta según tu lógica
        montoPago: fac.montoPago,
        saldoPendiente: fac.saldoPendiente,
        empresaId: fac.cliente.empresa?.id || 0,
        empresa: {
          id: fac.cliente.empresa?.id || 0,
          nombre: fac.cliente.empresa?.nombre || 'No especificada',
        },
        // metodoPago: fac.metodoPago,
        clienteId: fac.cliente.id,
        cliente: {
          id: fac.cliente.id,
          nombre: fac.cliente.nombre,
          apellidos: fac.cliente.apellidos,
          telefono: fac.cliente.telefono,
          direccion: fac.cliente.direccion || 'No especificada',
          dpi: fac.cliente.dpi || 'No especificado',
          estadoCliente: fac.cliente.estadoCliente,
          servicioInternet: fac.cliente.servicioInternet
            ? {
                id: fac.cliente.servicioInternet.id,
                nombre: fac.cliente.servicioInternet.nombre,
                velocidad:
                  fac.cliente.servicioInternet.velocidad || 'No especificada',
                precio: fac.cliente.servicioInternet.precio,
              }
            : null,
          facturacionZona: fac.cliente.facturacionZona
            ? {
                id: fac.cliente.facturacionZona.id,
                nombre: fac.cliente.facturacionZona.nombre,
              }
            : null,
          empresa: {
            id: fac.cliente.empresa?.id || 0,
            nombre: fac.cliente.empresa?.nombre || 'No especificada',
          },
        },
        estadoFacturaInternet: fac.estadoFacturaInternet,
        pagos: fac.pagos.map((pago) => ({
          cobrador: pago.cobrador.nombre,
          montoPagado: pago.montoPagado,
          metodoPago: pago.metodoPago,
          fechaPago: pago.fechaPago.toISOString(),
          cobradorId: pago.cobradorId,
          creadoEn: pago.creadoEn.toISOString(),
        })),
        creadoEn: fac.creadoEn.toISOString(),
        actualizadoEn: fac.creadoEn?.toISOString() || null,
        nombreClienteFactura: `${fac.cliente.nombre} ${fac.cliente.apellidos}`,
        detalleFactura: `Servicio de Internet ${fac.cliente.servicioInternet?.nombre || 'No asignado'} - ${new Date(fac.fechaPagoEsperada).getMonth() + 1} ${new Date(fac.fechaPagoEsperada).getFullYear()}`,
        facturacionZonaId: fac.cliente.facturacionZona?.id,
        facturacionZona: {
          id: fac.cliente.facturacionZona?.id || 0,
          nombre: fac.cliente.facturacionZona?.nombre || 'No asignada',
        },
        RecordatorioPago: fac.RecordatorioPago.map((recordatorio) => ({
          id: recordatorio.id,
          fechaEnvio: recordatorio.creadoEn.toISOString(),
          medioEnvio: recordatorio.tipo,
        })),
      }));

      return resultado;
    } catch (error) {
      console.log('Error al obtener las facturas:', error);
      throw new Error('No se pudo obtener la información de las facturas.');
    }
  }

  async findOneFacturaWithPayments(id: number) {
    try {
      console.log('El id es: ', id);

      const factura = await this.prisma.facturaInternet.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          montoPago: true,
          saldoPendiente: true,
          // metodoPago: true,
          creadoEn: true,
          fechaPagoEsperada: true,
          estadoFacturaInternet: true,
          fechaPagada: true,
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              direccion: true,
              dpi: true,
              estadoCliente: true,
              servicioInternet: {
                select: {
                  id: true,
                  nombre: true,
                  velocidad: true,
                  precio: true,
                },
              },
              facturacionZona: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              empresa: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },

          pagos: {
            select: {
              cobrador: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              montoPagado: true,
              fechaPago: true,
              creadoEn: true,
              metodoPago: true,
              cobradorId: true,
            },
          },
          RecordatorioPago: {
            select: {
              id: true,
              creadoEn: true,
              tipo: true,
            },
          },
        },
      });

      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      // Procesamos la factura para que coincida con la estructura deseada
      const resultado = {
        id: factura.id,
        fechaPagoEsperada: factura.fechaPagoEsperada?.toISOString() || null,
        fechaPagada: factura.fechaPagada, // Asumimos que aún no ha sido pagada, ajusta según tu lógica
        montoPago: factura.montoPago,
        saldoPendiente: factura.saldoPendiente,
        empresaId: factura.cliente.empresa?.id || 0,
        empresa: {
          id: factura.cliente.empresa?.id || 0,
          nombre: factura.cliente.empresa?.nombre || 'No especificada',
        },
        // metodoPago: factura.metodoPago,
        clienteId: factura.cliente.id,
        cliente: {
          id: factura.cliente.id,
          nombre: factura.cliente.nombre,
          apellidos: factura.cliente.apellidos,
          telefono: factura.cliente.telefono,
          direccion: factura.cliente.direccion || 'No especificada',
          dpi: factura.cliente.dpi || 'No especificado',
          estadoCliente: factura.cliente.estadoCliente,
          servicioInternet: factura.cliente.servicioInternet
            ? {
                id: factura.cliente.servicioInternet.id,
                nombre: factura.cliente.servicioInternet.nombre,
                velocidad:
                  factura.cliente.servicioInternet.velocidad ||
                  'No especificada',
                precio: factura.cliente.servicioInternet.precio,
              }
            : null,
          facturacionZona: factura.cliente.facturacionZona
            ? {
                id: factura.cliente.facturacionZona.id,
                nombre: factura.cliente.facturacionZona.nombre,
              }
            : null,
          empresa: {
            id: factura.cliente.empresa?.id || 0,
            nombre: factura.cliente.empresa?.nombre || 'No especificada',
          },
        },
        estadoFacturaInternet: factura.estadoFacturaInternet,
        pagos: factura.pagos.map((pago) => ({
          cobrador: pago.cobrador.nombre,
          montoPagado: pago.montoPagado,
          metodoPago: pago.metodoPago,
          fechaPago: pago.fechaPago.toISOString(),
          cobradorId: pago.cobradorId,
          creadoEn: pago.creadoEn.toISOString(),
        })),
        creadoEn: factura.creadoEn.toISOString(),
        actualizadoEn: factura.creadoEn?.toISOString() || null,
        nombreClienteFactura: `${factura.cliente.nombre} ${factura.cliente.apellidos}`,
        detalleFactura: `Servicio de Internet ${factura.cliente.servicioInternet?.nombre || 'No asignado'} - ${formatearFecha(factura.fechaPagoEsperada.toISOString())}`,
        facturacionZonaId: factura.cliente.facturacionZona?.id,
        facturacionZona: {
          id: factura.cliente.facturacionZona?.id || 0,
          nombre: factura.cliente.facturacionZona?.nombre || 'No asignada',
        },
        RecordatorioPago: factura.RecordatorioPago.map((recordatorio) => ({
          id: recordatorio.id,
          fechaEnvio: recordatorio.creadoEn.toISOString(),
          medioEnvio: recordatorio.tipo,
        })),
      };

      return resultado;
    } catch (error) {
      console.log('Error al obtener la factura:', error);
      throw new Error('No se pudo obtener la información de la factura.');
    }
  }

  // async createNewPaymentFacturacion(
  //   createFacturacionPaymentDto: CreateFacturacionPaymentDto,
  // ) {
  //   console.log('Datos del pago:', createFacturacionPaymentDto);

  //   try {
  //     const newFacturacionPayment = await this.prisma.$transaction(
  //       async (tx) => {
  //         // 1. Crear el nuevo pago
  //         const newPayment = await tx.pagoFacturaInternet.create({
  //           data: {
  //             cliente: {
  //               connect: { id: createFacturacionPaymentDto.clienteId },
  //             },
  //             montoPagado: createFacturacionPaymentDto.montoPagado,
  //             facturaInternet: {
  //               connect: { id: createFacturacionPaymentDto.facturaInternetId },
  //             },
  //             metodoPago: createFacturacionPaymentDto.metodoPago,
  //             cobrador: {
  //               connect: { id: createFacturacionPaymentDto.cobradorId },
  //             },
  //           },
  //         });
  //         console.log('Nuevo pago creado:', newPayment);

  //         // 2. Calcular el total pagado (incluyendo el nuevo pago)
  //         const totalPagado = await tx.pagoFacturaInternet.aggregate({
  //           _sum: { montoPagado: true },
  //           where: {
  //             facturaInternetId: createFacturacionPaymentDto.facturaInternetId,
  //           },
  //         });
  //         const cantidadTotalPagada = totalPagado._sum.montoPagado || 0;
  //         console.log('Total pagado:', cantidadTotalPagada);

  //         // 3. Obtener datos actuales de la factura
  //         const facturaActual = await tx.facturaInternet.findUnique({
  //           where: { id: createFacturacionPaymentDto.facturaInternetId },
  //         });
  //         console.log('Factura actual:', facturaActual);

  //         // 4. Calcular nuevo saldo pendiente
  //         const montoTotalFactura = facturaActual.montoPago;
  //         const newSaldoPendiente = Math.max(
  //           0,
  //           montoTotalFactura - cantidadTotalPagada,
  //         );
  //         console.log('Nuevo saldo pendiente:', newSaldoPendiente);

  //         // 5. Determinar el estado basado en el saldo
  //         let nuevoEstado: StateFacturaInternet;
  //         let fechaPagada: Date | null = null; // Inicializamos como null en caso de que no haya pago
  //         if (newSaldoPendiente <= 0) {
  //           nuevoEstado = StateFacturaInternet.PAGADA;
  //           fechaPagada = new Date();
  //         } else if (cantidadTotalPagada > 0) {
  //           nuevoEstado = StateFacturaInternet.PARCIAL;
  //         } else {
  //           nuevoEstado = StateFacturaInternet.PENDIENTE;
  //         }
  //         console.log('Nuevo estado:', nuevoEstado);

  //         // 6. Actualizar la factura
  //         const updatedFactura = await tx.facturaInternet.update({
  //           where: { id: createFacturacionPaymentDto.facturaInternetId },
  //           data: {
  //             saldoPendiente: newSaldoPendiente,
  //             estadoFacturaInternet: nuevoEstado,
  //             fechaPagada: fechaPagada,
  //           },
  //         });
  //         console.log('Factura actualizada:', updatedFactura);

  //         // 7. SUBIRLE EL SALDO AL CLIENTE Y EL PENDIENTE ACTUALIZARLO
  //         const nuevoSaldoCliente = await tx.saldoCliente.update({
  //           where: {
  //             id: createFacturacionPaymentDto.clienteId,
  //           },
  //           data: {
  //             saldoFavor: {
  //               increment: createFacturacionPaymentDto.montoPagado,
  //             },
  //             totalPagos: {
  //               increment: createFacturacionPaymentDto.montoPagado,
  //             },
  //             // saldoPendiente: createFacturacionPaymentDto.montoPagado > ,
  //             ultimoPago: new Date(),
  //           },
  //         });

  //         // Validar y actualizar el saldo pendiente
  //         if (
  //           createFacturacionPaymentDto.montoPagado >=
  //           nuevoSaldoCliente.saldoPendiente
  //         ) {
  //           await this.prisma.saldoCliente.update({
  //             where: {
  //               id: nuevoSaldoCliente.clienteId,
  //             },
  //             data: {
  //               saldoPendiente: 0, // No permitimos que el saldo pendiente sea negativo
  //             },
  //           });
  //         } else {
  //           await this.prisma.saldoCliente.update({
  //             where: {
  //               id: nuevoSaldoCliente.clienteId,
  //             },
  //             data: {
  //               saldoPendiente: {
  //                 decrement: createFacturacionPaymentDto.montoPagado, // Decrementamos el saldo pendiente
  //               },
  //             },
  //           });
  //         }
  //         const facturaPagada = await tx.facturaInternet.findUnique({
  //           where: {
  //             id: newPayment.facturaInternetId,
  //           },
  //           select: {
  //             id: true,
  //             estadoFacturaInternet: true,
  //             montoPago: true,
  //             detalleFactura: true,
  //             creadoEn: true,
  //             fechaPagoEsperada: true,
  //             nombreClienteFactura: true,
  //             saldoPendiente: true,
  //             cliente: {
  //               select: {
  //                 id: true,
  //                 nombre: true,
  //                 apellidos: true,
  //                 dpi: true,
  //               },
  //             },
  //             empresa: {
  //               select: {
  //                 id: true,
  //                 nombre: true,
  //                 direccion: true,
  //                 correo: true,
  //                 pbx: true,
  //                 sitioWeb: true,
  //                 telefono: true,
  //                 nit: true,
  //               },
  //             },
  //             pagos: {
  //               select: {
  //                 id: true,
  //                 metodoPago: true,
  //                 fechaPago: true,
  //                 montoPagado: true,
  //                 creadoEn: true,
  //               },
  //             },
  //           },
  //         });

  //         const pagos = facturaPagada.pagos.map((pago) => ({
  //           id: pago.id,
  //           metodoPago: pago.metodoPago,
  //           montoPagado: pago.montoPagado,
  //           fechaPago: pago.fechaPago.toISOString(),
  //           creadoEn: pago.creadoEn.toISOString(),
  //         }));

  //         const totalPagados = pagos.reduce(
  //           (total, pago) => total + pago.montoPagado,
  //           0,
  //         );
  //         const saldoPendiente = facturaPagada.montoPago - totalPagados;

  //         // Estructurar la data de la factura
  //         const facturaData = {
  //           id: facturaPagada.id,
  //           estadoFacturaInternet: facturaPagada.estadoFacturaInternet,
  //           montoPago: facturaPagada.montoPago,
  //           detalleFactura: facturaPagada.detalleFactura,
  //           creadoEn: facturaPagada.creadoEn.toISOString(),
  //           fechaPagoEsperada: facturaPagada.fechaPagoEsperada?.toISOString(),
  //           saldoPendiente,
  //           cliente: {
  //             id: facturaPagada.cliente.id,
  //             nombre: facturaPagada.cliente.nombre,
  //             apellidos: facturaPagada.cliente.apellidos,
  //             dpi: facturaPagada.cliente.dpi,
  //           },
  //           empresa: {
  //             id: facturaPagada.empresa.id,
  //             nombre: facturaPagada.empresa.nombre,
  //             direccion: facturaPagada.empresa.direccion,
  //             correo: facturaPagada.empresa.correo,
  //             pbx: facturaPagada.empresa.pbx,
  //             sitioWeb: facturaPagada.empresa.sitioWeb,
  //             telefono: facturaPagada.empresa.telefono,
  //             nit: facturaPagada.empresa.nit,
  //           },
  //           pagos,
  //         };

  //         console.log('Factura con pagos:', facturaData);
  //         return { newPayment, facturaData };
  //       },
  //     );

  //     console.log('Pago registrado:', newFacturacionPayment);
  //     return newFacturacionPayment;
  //   } catch (error) {
  //     console.error('Error al crear el pago:', error);
  //     throw new Error('Error al procesar el pago');
  //   }
  // }

  async createNewPaymentFacturacion(
    createFacturacionPaymentDto: CreateFacturacionPaymentDto,
  ) {
    console.log('Datos del pago:', createFacturacionPaymentDto);

    try {
      const newFacturacionPayment = await this.prisma.$transaction(
        async (tx) => {
          // 1. Crear el nuevo pago
          const newPayment = await tx.pagoFacturaInternet.create({
            data: {
              cliente: {
                connect: { id: createFacturacionPaymentDto.clienteId },
              },
              montoPagado: createFacturacionPaymentDto.montoPagado,
              facturaInternet: {
                connect: { id: createFacturacionPaymentDto.facturaInternetId },
              },
              metodoPago: createFacturacionPaymentDto.metodoPago,
              cobrador: {
                connect: { id: createFacturacionPaymentDto.cobradorId },
              },
            },
          });

          console.log('Nuevo pago creado:', newPayment);

          // 2. Calcular el total pagado (incluyendo el nuevo pago)
          const totalPagado = await tx.pagoFacturaInternet.aggregate({
            _sum: { montoPagado: true },
            where: {
              facturaInternetId: createFacturacionPaymentDto.facturaInternetId,
            },
          });
          const cantidadTotalPagada = totalPagado._sum.montoPagado || 0;

          // 3. Obtener datos actuales de la factura
          const facturaActual = await tx.facturaInternet.findUnique({
            where: { id: createFacturacionPaymentDto.facturaInternetId },
          });

          // 4. Calcular nuevo saldo pendiente y actualizar factura
          const montoTotalFactura = facturaActual.montoPago;
          const newSaldoPendiente = Math.max(
            0,
            montoTotalFactura - cantidadTotalPagada,
          );

          let nuevoEstado: StateFacturaInternet;
          let fechaPagada: Date | null = null;

          if (newSaldoPendiente <= 0) {
            nuevoEstado = StateFacturaInternet.PAGADA;
            fechaPagada = new Date();
          } else if (cantidadTotalPagada > 0) {
            nuevoEstado = StateFacturaInternet.PARCIAL;
          } else {
            nuevoEstado = StateFacturaInternet.PENDIENTE;
          }

          const updatedFactura = await tx.facturaInternet.update({
            where: { id: createFacturacionPaymentDto.facturaInternetId },
            data: {
              saldoPendiente: newSaldoPendiente,
              estadoFacturaInternet: nuevoEstado,
              fechaPagada: fechaPagada,
            },
          });

          // Actualizar el saldo del cliente
          const nuevoSaldoCliente = await tx.saldoCliente.update({
            where: {
              id: createFacturacionPaymentDto.clienteId,
            },
            data: {
              saldoFavor: {
                increment: createFacturacionPaymentDto.montoPagado,
              },
              totalPagos: {
                increment: createFacturacionPaymentDto.montoPagado,
              },
              ultimoPago: new Date(),
            },
          });

          // Aquí puedes agregar la lógica de actualización del saldo pendiente, si es necesario.
          // Validar y actualizar el saldo pendiente
          if (
            createFacturacionPaymentDto.montoPagado >=
            nuevoSaldoCliente.saldoPendiente
          ) {
            // Si el monto pagado es mayor o igual al saldo pendiente, el saldo pendiente se pone a 0
            await tx.saldoCliente.update({
              where: {
                id: nuevoSaldoCliente.clienteId,
              },
              data: {
                saldoPendiente: 0, // No permitimos que el saldo pendiente sea negativo
              },
            });
          } else {
            // Si el monto pagado es menor al saldo pendiente, decrementamos el saldo pendiente correctamente
            await tx.saldoCliente.update({
              where: {
                id: nuevoSaldoCliente.clienteId,
              },
              data: {
                saldoPendiente: {
                  decrement: createFacturacionPaymentDto.montoPagado, // Decrementamos el saldo pendiente
                },
              },
            });
          }
          return { newPayment, updatedFactura };
        },
        { timeout: 10000 }, // Aumentamos el tiempo de la transacción a 10 segundos
      );

      // const facturaPdfPagoData = this.getFacturaToPDf(
      //   createFacturacionPaymentDto.facturaInternetId,
      // );
      const dataToPdfSucces = {
        facturaInternetId: newFacturacionPayment.newPayment.facturaInternetId,
        clienteId: newFacturacionPayment.newPayment.clienteId,
      };

      console.log('Pago registrado:', newFacturacionPayment);
      return dataToPdfSucces;
    } catch (error) {
      console.error('Error al crear el pago:', error);
      throw new Error('Error al procesar el pago');
    }
  }

  async findAllFacturasConPago() {
    try {
      const facturasConPagos = await this.prisma.pagoFacturaInternet.findMany({
        // include: {
        //   pagos: true,
        // },
      });
      return facturasConPagos;
    } catch (error) {
      console.log(error);
    }
  }

  async facturacionToTable() {
    try {
      const facturas = await this.prisma.facturaInternet.findMany({
        select: {
          id: true,
          // estadoFacturaInternet: true,
          estadoFacturaInternet: true,
          cliente: {
            select: {
              nombre: true,
              id: true,
              apellidos: true,
              telefono: true,
              IP: {
                select: {
                  direccionIp: true,
                },
              },
            },
          },
          montoPago: true,
          creadoEn: true,
          fechaPagoEsperada: true,
          pagos: {
            select: {
              cobrador: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
      });

      // Mapeamos las facturas para ajustarlas al formato `Factura`
      const facturasMapeadas = facturas.map((factura) => ({
        id: factura.id,
        // metodo: factura.metodoPago,
        estado: factura.estadoFacturaInternet,
        cliente: `${factura.cliente.nombre} ${factura.cliente.apellidos || ''}`,
        clienteId: factura.cliente.id,
        direccionIp: factura.cliente.IP.direccionIp || 'No disponible',
        cantidad: factura.montoPago || 0,
        fechaCreado: factura.creadoEn.toISOString(),
        fechaPago:
          factura.fechaPagoEsperada?.toISOString() || 'No especificada',
        por:
          factura.pagos.map((pago) => pago.cobrador.nombre).join(', ') ||
          'No especificado',
        telefono: factura.cliente.telefono || 0,
      }));

      const cobrados = facturas.filter((fac) => {
        return !['PENDIENTE', 'PARCIAL', 'VENCIDA', 'ANULADA'].includes(
          fac.estadoFacturaInternet,
        );
      });

      const facturados = facturas; //el total de facturas que tenemos actualmente
      const porCobrar = Math.abs(facturados.length - cobrados.length); //la diferencia entre los cobrados y no

      return {
        facturasMapeadas: facturasMapeadas,
        cobrados: cobrados.length,
        facturados: facturados.length,
        porCobrar: porCobrar,
      };
    } catch (error) {
      console.error('Error al obtener las facturas:', error);
      throw new Error('No se pudo obtener las facturas.');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} facturacion`;
  }

  update(id: number, updateFacturacionDto: UpdateFacturacionDto) {
    return `This action updates a #${id} facturacion`;
  }

  async remove() {
    try {
      const facturasToDelete = await this.prisma.facturaInternet.deleteMany({});
      return facturasToDelete;
    } catch (error) {
      console.log(error);
    }
  }

  async getFacturaToPDf(id: number) {
    try {
      const facturaPagada = await this.prisma.facturaInternet.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          estadoFacturaInternet: true,
          montoPago: true,
          detalleFactura: true,
          creadoEn: true,
          fechaPagoEsperada: true,
          nombreClienteFactura: true,
          saldoPendiente: true,
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              dpi: true,
            },
          },
          empresa: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              correo: true,
              pbx: true,
              sitioWeb: true,
              telefono: true,
              nit: true,
            },
          },
          pagos: {
            select: {
              id: true,
              metodoPago: true,
              fechaPago: true,
              montoPagado: true,
              creadoEn: true,
            },
          },
        },
      });

      const pagos = facturaPagada.pagos.map((pago) => ({
        id: pago.id,
        metodoPago: pago.metodoPago,
        montoPagado: pago.montoPagado,
        fechaPago: pago.fechaPago.toISOString(),
        creadoEn: pago.creadoEn.toISOString(),
      }));

      const totalPagados = pagos.reduce(
        (total, pago) => total + pago.montoPagado,
        0,
      );
      const saldoPendiente = facturaPagada.montoPago - totalPagados;

      // Estructurar la data de la factura
      const facturaData = {
        id: facturaPagada.id,
        estadoFacturaInternet: facturaPagada.estadoFacturaInternet,
        montoPago: facturaPagada.montoPago,
        detalleFactura: facturaPagada.detalleFactura,
        creadoEn: facturaPagada.creadoEn.toISOString(),
        fechaPagoEsperada: facturaPagada.fechaPagoEsperada?.toISOString(),
        saldoPendiente,
        cliente: {
          id: facturaPagada.cliente.id,
          nombre: facturaPagada.cliente.nombre,
          apellidos: facturaPagada.cliente.apellidos,
          dpi: facturaPagada.cliente.dpi,
        },
        empresa: {
          id: facturaPagada.empresa.id,
          nombre: facturaPagada.empresa.nombre,
          direccion: facturaPagada.empresa.direccion,
          correo: facturaPagada.empresa.correo,
          pbx: facturaPagada.empresa.pbx,
          sitioWeb: facturaPagada.empresa.sitioWeb,
          telefono: facturaPagada.empresa.telefono,
          nit: facturaPagada.empresa.nit,
        },
        pagos,
      };
      return facturaData;
    } catch (error) {
      console.log(error);
    }
  }
}
