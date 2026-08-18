// import { Inject, Injectable } from '@nestjs/common';
// import {
//     CLIENTE_REPORTE_QUERY_PORT,
//   ClienteReporteQueryPort,
// } from '../../domain/ports/cliente-reportes/cliente-reporte-query.port';
// import {
//   GeneratedXlsx,
//   XLSX_WRITER_PORT,
//   XlsxWriterPort,
// } from '../../domain/ports/xlsx-writer.port';
// import { ClienteReporteFilters } from '../../domain/filters/clientes-query-filters';

// @Injectable()
// export class ExportarClientesXlsxUseCase {
//   constructor(
//     @Inject(CLIENTE_REPORTE_QUERY_PORT)
//     private readonly clientesQuery: ClienteReporteQueryPort,

//     @Inject(XLSX_WRITER_PORT)
//     private readonly xlsxWriter: XlsxWriterPort,
//   ) {}

//   async execute(filters: ClienteReporteFilters): Promise<GeneratedXlsx> {
//     const clientes = await this.clientesQuery.findForReport(filters);

//     return this.xlsxWriter.write({
//       filename: 'reporte-clientes.xlsx',

//       sheetName: 'Clientes',

//       rows: clientes,

//       columns: [
//         {
//           header: 'ID',
//           value: (row) => row.id,
//           width: 10,
//         },
//         {
//           header: 'Cliente',
//           value: (row) => row.nombre,
//           width: 35,
//         },
//         {
//           header: 'Tel',
//           value: (row) => row.telefono,
//           width: 18,
//         },
//         {
//           header: 'Tel. Ref',
//           value: (row) => row.telefonoReferencia,
//           width: 18,
//         },

//         {
//           header: 'Estado',
//           value: (row) => row.estado,
//           width: 18,
//         },
//         {
//           header: 'Estado Cobranza',
//           value: (row) => row.estadoCobranza,
//           width: 18,
//         },

//         {
//           header: 'Plan',
//           value: (row) => row.plan,
//           width: 30,
//         },

//         {
//           header: 'Creado',
//           value: (row) => row.creadoEn,
//           width: 22,
//         },
//       ],
//     });
//   }
// }
