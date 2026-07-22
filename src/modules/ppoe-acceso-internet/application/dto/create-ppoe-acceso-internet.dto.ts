// export class CreatePpoeAccesoInternetDto {
//     empresaId?:number

// }

// model ClienteAccesoInternet {
//   id  Int  @id @default(autoincrement())

//   empresaId  Int
//   clienteId  Int

//   servicioInternetId  Int?

//   tecnologia           TecnologiaAccesoInternet
//   metodoAutenticacion  MetodoAutenticacionInternet
//   estado               EstadoAccesoInternet         @default(PENDIENTE)

//   activadoEn    DateTime?
//   suspendidoEn  DateTime?
//   dadoDeBajaEn  DateTime?

//   creadoEn       DateTime  @default(now())
//   actualizadoEn  DateTime  @updatedAt

//   empresa  Empresa  @relation(fields: [empresaId], references: [id], onDelete: Restrict)

//   cliente  ClienteInternet  @relation(fields: [clienteId], references: [id], onDelete: Restrict)

//   servicioInternet  ServicioInternet?  @relation(fields: [servicioInternetId], references: [id], onDelete: SetNull)

// }
