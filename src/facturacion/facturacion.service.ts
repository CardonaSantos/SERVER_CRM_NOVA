import { Injectable } from '@nestjs/common';
import { CreateFacturacionDto } from './dto/create-facturacion.dto';
import { UpdateFacturacionDto } from './dto/update-facturacion.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFacturacionPaymentDto } from './dto/createFacturacionPayment.dto';
import {
  EstadoCliente,
  EstadoFacturaInternet,
  Prisma,
  StateFacturaInternet,
} from '@prisma/client';
import * as dayjs from 'dayjs';
import { CreatePaymentOnRuta } from './dto/createPaymentOnRuta.dto';
import { GenerateFactura } from './dto/generateFactura.dto';
import 'dayjs/locale/es'; // Carga el idioma español
import { GenerateFacturaMultipleDto } from './dto/generateMultipleFactura.dto';

dayjs.locale('es'); // Establece español como idioma predeterminado
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

interface DatosFacturaGenerate {
  fechaPagoEsperada: string;

  montoPago: number;
  saldoPendiente: number;
  datalleFactura: string;
  estadoFacturaInternet: string;
  cliente: number;
  facturacionZona: number;
  nombreClienteFactura: string;
}

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

      const dataToSelect = {
        id: true,
        montoPago: true,
        saldoPendiente: true,
        // metodoPago: true,
        creadoEn: true,
        fechaPagoEsperada: true,
        estadoFacturaInternet: true,
        detalleFactura: true,
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
      };

      const factura = await this.prisma.facturaInternet.findUnique({
        where: {
          id: id,
        },
        select: dataToSelect,
      });

      const otrasFacturasPendientes =
        await this.prisma.facturaInternet.findMany({
          where: {
            clienteId: factura.cliente.id,
            estadoFacturaInternet: {
              in: ['PARCIAL', 'PENDIENTE', 'VENCIDA'],
            },
            id: {
              not: factura.id,
            },
          },
          select: dataToSelect,
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
        detalleFactura: `${factura.detalleFactura}`,
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
        facturasPendientes: otrasFacturasPendientes
          .sort(
            (a, b) =>
              new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
          )
          .map((factura) => ({
            id: factura.id,
            fechaPagoEsperada: factura.fechaPagoEsperada,
            montoPago: factura.montoPago,
            estadoFacturaInternet: factura.estadoFacturaInternet,
          })),
      };

      return resultado;
    } catch (error) {
      console.log('Error al obtener la factura:', error);
      throw new Error('No se pudo obtener la información de la factura.');
    }
  }
  //REGISTRAR UN PAGO [NO-EN-RUTA] AJUSTAR EL PAGO
  async createNewPaymentFacturacion(
    createFacturacionPaymentDto: CreateFacturacionPaymentDto,
  ) {
    const {
      facturaInternetId,
      clienteId,
      montoPagado,
      metodoPago,
      cobradorId,
      numeroBoleta,
    } = createFacturacionPaymentDto;

    const numeroBoletaReal =
      metodoPago === 'DEPOSITO' && numeroBoleta?.trim() ? numeroBoleta : null;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Crear nuevo pago
      const newPayment = await tx.pagoFacturaInternet.create({
        data: {
          cliente: { connect: { id: clienteId } },
          montoPagado,
          facturaInternet: { connect: { id: facturaInternetId } },
          metodoPago,
          cobrador: {
            connect: { id: cobradorId },
          },
          numeroBoleta: numeroBoletaReal,
        },
      });

      // 2. Actualizar saldo del cliente
      const clienteSaldo = await tx.saldoCliente.findUnique({
        where: { clienteId },
      });

      if (clienteSaldo) {
        const nuevoSaldoPendiente = clienteSaldo.saldoPendiente - montoPagado;
        const saldoPendienteAjustado = Math.max(nuevoSaldoPendiente, 0); // Evita que el saldo pendiente sea negativo

        await tx.saldoCliente.update({
          where: { clienteId },
          data: {
            saldoPendiente: saldoPendienteAjustado,
            totalPagos: clienteSaldo.totalPagos + montoPagado,
            ultimoPago: new Date(),
          },
        });
      }

      // 3. Actualizar la factura de internet
      const factura = await tx.facturaInternet.findUnique({
        where: { id: facturaInternetId },
      });

      if (factura) {
        const saldoPendienteFacturaAjustado = Math.max(
          factura.saldoPendiente - montoPagado,
          0,
        ); // Evita que el saldo pendiente de la factura sea negativo

        await tx.facturaInternet.update({
          where: { id: facturaInternetId },
          data: {
            saldoPendiente: saldoPendienteFacturaAjustado,
            estadoFacturaInternet:
              saldoPendienteFacturaAjustado <= 0
                ? 'PAGADA'
                : saldoPendienteFacturaAjustado < factura.montoPago &&
                    saldoPendienteFacturaAjustado > 0
                  ? 'PARCIAL'
                  : 'PENDIENTE',
          },
        });
      }

      // 4. Calcular el estado del cliente
      const facturasPendientes = await tx.facturaInternet.findMany({
        where: {
          clienteId,
          estadoFacturaInternet: {
            in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'],
          },
        },
      });

      // Si hay facturas pendientes, el cliente pasa a MOROSO
      const estadoCliente = facturasPendientes.length > 0 ? 'MOROSO' : 'ACTIVO';

      // 5. Actualizar el estado del cliente
      await tx.clienteInternet.update({
        where: { id: clienteId },
        data: {
          estadoCliente: estadoCliente,
        },
      });

      return newPayment;
    });
  }

  //ACTUALIZAR EL ESTADO DE LA FACTURA
  // ACTUALIZAR EL ESTADO DE LA FACTURA
  // ACTUALIZAR EL ESTADO DE LA FACTURA
  private async updateFacturaState(
    tx: Prisma.TransactionClient,
    facturaId: number,
    montoPagado: number,
  ) {
    console.log('El monto pagado es. ', montoPagado);

    // El total de pagos realizados para esta factura
    const totalPagado = await tx.pagoFacturaInternet.aggregate({
      _sum: { montoPagado: true },
      where: { facturaInternetId: facturaId },
    });
    console.log('El total pagado es: ', totalPagado);

    const facturaActual = await tx.facturaInternet.findUnique({
      where: { id: facturaId },
      select: { montoPago: true, id: true },
    });

    const cantidadTotalPagada = totalPagado._sum.montoPagado || 0;

    // Si el pago actual es menor que el saldo pendiente, no restes más de lo que se ha pagado en esta ocasión
    const newSaldoPendiente = Math.max(
      0,
      facturaActual.montoPago - montoPagado, // Restamos solo el monto actual pagado
    );
    console.log(
      'El saldo pendiente de esta factura es: ',
      newSaldoPendiente,
      facturaActual.id,
    );

    let nuevoEstado: StateFacturaInternet;
    let fechaPagada: Date | null = null;

    // Si el saldo pendiente es 0, la factura se considera pagada
    if (newSaldoPendiente <= 0) {
      nuevoEstado = StateFacturaInternet.PAGADA;
      fechaPagada = new Date();
    } else {
      // Si hay algún pago, se marca como parcial
      nuevoEstado =
        montoPagado > 0
          ? StateFacturaInternet.PARCIAL
          : StateFacturaInternet.PENDIENTE;
    }

    return tx.facturaInternet.update({
      where: { id: facturaId },
      data: {
        saldoPendiente: newSaldoPendiente,
        estadoFacturaInternet: nuevoEstado,
        fechaPagada,
      },
    });
  }

  // ACTUALIZAR EL SALDO DEL CLIENTE Y SU ESTADO
  private async updateClienteSaldoPagoUnico(
    tx: Prisma.TransactionClient,
    clienteId: number,
    montoPagado: number,
    facturaInternetId: number, // Recibimos el ID de la factura que se está pagando
  ) {
    // Obtener la factura específica que se está pagando
    const facturaPendiente = await tx.facturaInternet.findUnique({
      where: { id: facturaInternetId },
      select: { saldoPendiente: true, montoPago: true },
    });

    if (!facturaPendiente) throw new Error('Factura no encontrada');

    const saldoPendienteFactura = facturaPendiente.saldoPendiente;
    console.log(
      'El saldo pendiente de esta factura es: ',
      saldoPendienteFactura,
    );

    // Calcular el nuevo saldo pendiente de la factura específica
    const nuevoSaldoPendienteFactura = Math.max(
      0,
      saldoPendienteFactura - montoPagado,
    );
    console.log(
      'El nuevo saldo pendiente de esta factura es: ',
      nuevoSaldoPendienteFactura,
    );

    // Calcular el saldo total pendiente del cliente solo con facturas que estén pendientes o parciales
    const totalSaldo = await tx.facturaInternet.aggregate({
      _sum: { saldoPendiente: true },
      where: {
        clienteId,
        estadoFacturaInternet: {
          in: [StateFacturaInternet.PENDIENTE, StateFacturaInternet.PARCIAL],
        },
      },
    });

    const saldoPendienteClienteActual = totalSaldo._sum.saldoPendiente || 0;
    const nuevoSaldoPendienteTotalCliente = Math.max(
      0,
      saldoPendienteClienteActual - montoPagado,
    );

    // Calcular el saldo a favor si se pagó más de lo que se debía en la factura
    const saldoFavor = Math.max(0, montoPagado - saldoPendienteFactura);

    return tx.saldoCliente.upsert({
      where: { clienteId },
      create: {
        saldoPendiente: nuevoSaldoPendienteTotalCliente,
        saldoFavor,
        totalPagos: montoPagado,
        ultimoPago: new Date(),
        cliente: { connect: { id: clienteId } },
      },
      update: {
        saldoPendiente: nuevoSaldoPendienteTotalCliente,
        saldoFavor: { increment: saldoFavor },
        totalPagos: { increment: montoPagado },
        ultimoPago: new Date(),
      },
    });
  }

  // ACTUALIZAR EL ESTADO DEL CLIENTE
  private async updateClienteState(
    tx: Prisma.TransactionClient,
    clienteId: number,
    montoPagado: number,
  ) {
    // Verificar si alguna factura del cliente está pendiente o parcialmente pagada
    const facturasPendientes = await tx.facturaInternet.findMany({
      where: {
        clienteId,
        estadoFacturaInternet: {
          in: [StateFacturaInternet.PENDIENTE, StateFacturaInternet.PARCIAL],
        },
      },
    });

    // Si alguna factura sigue pendiente o parcial, el cliente debe seguir siendo MOROSO
    const newState =
      facturasPendientes.length > 0
        ? EstadoCliente.MOROSO
        : EstadoCliente.ACTIVO;

    await tx.clienteInternet.update({
      where: { id: clienteId },
      data: { estadoCliente: newState },
    });
    return newState; // Lo retornamos para usarlo en el de ruta
  }

  private handlePaymentError(error: any) {
    console.error('Error en el pago:', error);
    throw new Error(
      error.code === 'P2002'
        ? 'Error de duplicación en los datos'
        : 'Error al procesar el pago',
    );
  }

  //REGISTRAR PAGO EN RUTA
  //REGISTRAR PAGO EN RUTA
  async createNewPaymentFacturacionForRuta(
    createFacturacionPaymentDto: CreatePaymentOnRuta,
  ) {
    console.log('Datos del pago:', createFacturacionPaymentDto);

    const { metodoPago, numeroBoleta } = createFacturacionPaymentDto;
    let numeroBoletaReal: string | null = null;

    // Si el método de pago es DEPOSITO, y el número de boleta es no vacío, asignar el número de boleta
    if (
      metodoPago === 'DEPOSITO' &&
      numeroBoleta &&
      numeroBoleta.trim() !== ''
    ) {
      numeroBoletaReal = numeroBoleta;
    }

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
              numeroBoleta: numeroBoletaReal,
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

          const rutaUpdated = await tx.ruta.update({
            where: {
              id: createFacturacionPaymentDto.rutaId,
            },
            data: {
              montoCobrado: createFacturacionPaymentDto.montoPagado,
            },
          });

          console.log('La nueva ruta actualizada es: ', rutaUpdated);

          // 5. Actualizar el saldo del cliente
          const saldoClienteActualizado = await tx.saldoCliente.update({
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

          // 6. Validar y actualizar el saldo pendiente del cliente
          if (
            createFacturacionPaymentDto.montoPagado >=
            saldoClienteActualizado.saldoPendiente
          ) {
            // Si el monto pagado es mayor o igual al saldo pendiente, el saldo pendiente se pone a 0
            await tx.saldoCliente.update({
              where: {
                id: saldoClienteActualizado.clienteId,
              },
              data: {
                saldoPendiente: 0, // No permitimos que el saldo pendiente sea negativo
              },
            });
          } else {
            // Si el monto pagado es menor al saldo pendiente, decrementamos el saldo pendiente correctamente
            await tx.saldoCliente.update({
              where: {
                id: saldoClienteActualizado.clienteId,
              },
              data: {
                saldoPendiente: {
                  decrement: createFacturacionPaymentDto.montoPagado, // Decrementamos el saldo pendiente
                },
              },
            });
          }

          // 7. Actualizar el estado del cliente según el saldo pendiente
          let newStateCliente: EstadoCliente;

          if (saldoClienteActualizado.saldoPendiente <= 0) {
            newStateCliente = 'ACTIVO';
          } else {
            newStateCliente = 'MOROSO';
          }

          await tx.clienteInternet.update({
            where: {
              id: createFacturacionPaymentDto.clienteId,
            },
            data: {
              estadoCliente: newStateCliente,
            },
          });

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
        orderBy: {
          creadoEn: 'desc',
        },
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
          facturacionZonaId: true,
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
        facturacionZonaId: factura.facturacionZonaId,
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

  //GENERAR MANUALMENTE UNA FACTURA DE INTERNET, FUTURA O PASADA
  async generateFacturaInternet(createGenerateFactura: GenerateFactura) {
    console.log('La data es  : ', createGenerateFactura);

    const cliente = await this.prisma.clienteInternet.findUnique({
      where: {
        id: createGenerateFactura.clienteId,
      },
      select: {
        facturacionZona: {
          select: {
            id: true,
            diaPago: true,
          },
        },
        id: true,
        nombre: true,
        apellidos: true,
        servicioInternet: {
          select: {
            id: true,
            nombre: true,
            velocidad: true,
            precio: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    const dataFactura: DatosFacturaGenerate = {
      datalleFactura: `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${cliente.facturacionZona.diaPago}`,
      fechaPagoEsperada: dayjs()
        .date(cliente.facturacionZona.diaPago) // Establece el día de la fecha
        .month(createGenerateFactura.mes - 1) // Establece el mes de la UI
        .year(createGenerateFactura.anio) // Establece el año de la UI
        .format('YYYY-MM-DD'),
      montoPago: cliente.servicioInternet.precio,
      saldoPendiente: cliente.servicioInternet.precio,
      estadoFacturaInternet: 'PENDIENTE',
      cliente: cliente.id,
      facturacionZona: cliente.facturacionZona.id,
      nombreClienteFactura: `${cliente.nombre} ${cliente.apellidos}`,
    };

    const mesNombre = dayjs()
      .month(createGenerateFactura.mes - 1)
      .year(createGenerateFactura.anio)
      .format('MMMM YYYY'); // Obtiene el nombre del mes y el año

    const detalleFactura = `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${cliente.facturacionZona.diaPago} de ${mesNombre}`;

    try {
      // Iniciamos la transacción
      const result = await this.prisma.$transaction(async (prisma) => {
        // Creamos la factura
        const newFacturaInternet = await prisma.facturaInternet.create({
          data: {
            creadoEn: dayjs().format(),
            fechaPagoEsperada: dayjs(dataFactura.fechaPagoEsperada)
              .month(createGenerateFactura.mes - 1)
              .toDate(),
            montoPago: dataFactura.montoPago,
            saldoPendiente: dataFactura.saldoPendiente,
            estadoFacturaInternet: 'PENDIENTE',
            cliente: {
              connect: { id: dataFactura.cliente },
            },
            facturacionZona: {
              connect: { id: dataFactura.facturacionZona },
            },
            nombreClienteFactura: dataFactura.nombreClienteFactura,
            detalleFactura: detalleFactura,
            empresa: {
              connect: {
                id: 1,
              },
            },
          },
        });

        // Actualizamos el estado del cliente
        await prisma.clienteInternet.update({
          where: {
            id: cliente.id,
          },
          data: {
            estadoCliente: 'MOROSO',
            saldoCliente: {
              update: {
                data: {
                  saldoPendiente: {
                    increment: newFacturaInternet.montoPago,
                  },
                },
              },
            },
          },
        });

        return newFacturaInternet;
      });

      // Si la transacción es exitosa, mostramos el resultado
      console.log('La factura creada es: ', result);
    } catch (error) {
      // Si hay un error, lo capturamos y mostramos
      console.error(
        'Error al generar la factura o actualizar el cliente:',
        error,
      );
    }
  }
  //GENERAR MANUALMENTE MULTIPLES FACTURAS
  async generateFacturaMultiple(
    createFacturaMultipleDto: GenerateFacturaMultipleDto,
  ) {
    const { mesInicio, mesFin, anio, clienteId } = createFacturaMultipleDto;
    console.log('La data llegando es: ', mesInicio, mesFin, anio, clienteId);

    const cliente = await this.prisma.clienteInternet.findUnique({
      where: {
        id: clienteId,
      },
      select: {
        id: true,
        empresaId: true,
        facturacionZona: {
          select: {
            id: true,
            diaPago: true,
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
      },
    });

    const facturas = [];

    for (let mes = mesInicio; mes <= mesFin; mes++) {
      const fechaPagoEsperada = dayjs()
        .year(anio)
        .month(mes - 1) // Ajustamos el mes para que sea 0-indexed
        .date(cliente.facturacionZona.diaPago)
        .format('YYYY-MM-DD');

      const mesNombre = dayjs()
        .month(mes - 1)
        .year(anio)
        .format('MMMM YYYY'); // Obtiene el nombre del mes y el año

      const detalleFactura = `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${cliente.facturacionZona.diaPago} de ${mesNombre}`;

      const nuevaFactura = await this.prisma.facturaInternet.create({
        data: {
          fechaPagoEsperada: dayjs(fechaPagoEsperada).toDate(),
          montoPago: cliente.servicioInternet.precio,
          saldoPendiente: cliente.servicioInternet.precio,
          estadoFacturaInternet: 'PENDIENTE',
          clienteId: clienteId,
          facturacionZonaId: cliente.facturacionZona.id,
          detalleFactura: detalleFactura,
          empresaId: cliente.empresaId,
        },
      });

      facturas.push(nuevaFactura);
    }

    const newSaldo = await this.prisma.clienteInternet.update({
      where: {
        id: cliente.id,
      },
      data: {
        estadoCliente: 'MOROSO',
        saldoCliente: {
          update: {
            saldoPendiente: {
              increment: facturas.reduce(
                (acc, factura) => acc + factura.montoPago,
                0,
              ),
            },
          },
        },
      },
    });

    console.log('el nuevo saldo es: ', newSaldo);

    return facturas;
  }
  //DESCONOCIDO??
  async generarFacturasInternet(clienteId: number) {
    const cliente = await this.prisma.clienteInternet.findUnique({
      where: {
        id: clienteId,
      },

      select: {
        facturacionZona: {
          select: {
            id: true,
            diaPago: true,
          },
        },
        id: true,
        nombre: true,
        apellidos: true,
        servicioInternet: {
          select: {
            id: true,
            nombre: true,
            velocidad: true,
            precio: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    const dataFactura: DatosFacturaGenerate = {
      datalleFactura: `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${cliente.facturacionZona.diaPago}`,
      fechaPagoEsperada: dayjs()
        .date(cliente.facturacionZona.diaPago) // Establece el día de la fecha
        .month(dayjs().month()) // Establece el mes actual
        .year(dayjs().year()) // Establece el año actual
        .isBefore(dayjs(), 'day') // Si la fecha es antes de hoy, pasa al siguiente mes
        ? dayjs().add(1, 'month').date(cliente.facturacionZona.diaPago).format() // Si es antes, agregamos un mes
        : dayjs().date(cliente.facturacionZona.diaPago).format(), // Si no es antes, usa el mes actual
      montoPago: cliente.servicioInternet.precio,
      saldoPendiente: cliente.servicioInternet.precio,
      estadoFacturaInternet: 'PENDIENTE',
      cliente: cliente.id,
      facturacionZona: cliente.facturacionZona.id,
      nombreClienteFactura: `${cliente.nombre} ${cliente.apellidos}`,
    };
    console.log('La data para generar la factura es: ', dataFactura);
    const mesNombre = dayjs().format('MMMM YYYY'); // Obtiene el mes y el año de la fecha actual

    const detalleFactura = `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${cliente.facturacionZona.diaPago} de ${mesNombre}`;

    const newFacturaInternet = await this.prisma.facturaInternet.create({
      data: {
        fechaPagoEsperada: dayjs(dataFactura.fechaPagoEsperada).toDate(),
        montoPago: dataFactura.montoPago,
        saldoPendiente: dataFactura.saldoPendiente,
        estadoFacturaInternet: 'PENDIENTE',
        cliente: {
          connect: { id: dataFactura.cliente },
        },
        facturacionZona: {
          connect: { id: dataFactura.facturacionZona },
        },
        nombreClienteFactura: dataFactura.nombreClienteFactura,
        detalleFactura: detalleFactura,
        empresa: {
          connect: {
            id: 1,
          },
        },
      },
    });
    const x = await this.prisma.facturaInternet.findUnique({
      where: {
        id: newFacturaInternet.id,
      },
      include: {
        pagos: true,
        RecordatorioPago: true,
      },
    });

    console.log('La factura creada es: ', x);
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
              numeroBoleta: true,
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
        numeroBoleta: pago.numeroBoleta,
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
