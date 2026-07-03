// import {
//   ClienteInternet,
//   EstadoCliente,
//   EstadoServicio,
//   ServicioInternet,
// } from '@prisma/client';

// export type ClienteParaFacturacion = Pick<
//   ClienteInternet,
//   | 'id'
//   | 'estadoCliente'
//   | 'isEliminado'
//   | 'desinstaladoEn'
//   | 'enviarRecordatorio'
//   | 'servicioInternetId'
// > & {
//   servicioInternet: Pick<ServicioInternet, 'id' | 'estado'> | null;
// };

// export function getMotivoClienteNoFacturable(
//   cliente: ClienteParaFacturacion,
// ): string | null {
//   if (cliente.isEliminado) {
//     return 'cliente eliminado';
//   }

//   if (cliente.desinstaladoEn) {
//     return 'cliente con fecha de desinstalación';
//   }

//   if (cliente.estadoCliente !== EstadoCliente.ACTIVO) {
//     return `estadoCliente=${cliente.estadoCliente}`;
//   }

//   if (!cliente.servicioInternetId || !cliente.servicioInternet) {
//     return 'cliente sin servicio de internet';
//   }

//   return null;
// }

// export function isClienteFacturable(cliente: ClienteParaFacturacion): boolean {
//   return getMotivoClienteNoFacturable(cliente) === null;
// }

// export function isClienteRecordable(cliente: ClienteParaFacturacion): boolean {
//   return isClienteFacturable(cliente) && cliente.enviarRecordatorio;
// }

// export function shouldSkipClient(cliente: ClienteParaFacturacion): boolean {
//   return !isClienteFacturable(cliente);
// }
