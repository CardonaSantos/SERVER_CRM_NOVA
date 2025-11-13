-- CreateEnum
CREATE TYPE "OrigenPago" AS ENUM ('RUTA', 'OFICINA', 'TRANSFERENCIA', 'EN_LINEA');

-- CreateEnum
CREATE TYPE "EstadoAsignacionRuta" AS ENUM ('ASIGNADA', 'EN_PROCESO', 'COBRADA', 'CANCELADA', 'REASIGNADA');

-- CreateEnum
CREATE TYPE "EstadoRutaTurno" AS ENUM ('ABIERTA', 'EN_CURSO', 'CERRADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "TipoPlantilla" AS ENUM ('GENERACION_FACTURA', 'RECORDATORIO_1', 'RECORDATORIO_2', 'AVISO_PAGO', 'SUSPENSION', 'CORTE');

-- CreateEnum
CREATE TYPE "StateFacturaInternet" AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA', 'ANULADA', 'PARCIAL');

-- CreateEnum
CREATE TYPE "ResultadoRecordatorioPago" AS ENUM ('PENDIENTE', 'PAGADO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoCobro" AS ENUM ('COBRADO', 'SIN_COBRAR');

-- CreateEnum
CREATE TYPE "EstadoMetaTicket" AS ENUM ('CANCELADO', 'ABIERTO', 'FINALIZADO', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoRuta" AS ENUM ('ACTIVO', 'CERRADO', 'CANCELADO', 'EN_CURSO', 'ASIGNADA');

-- CreateEnum
CREATE TYPE "EstadoMetaTickets" AS ENUM ('ACTIVO', 'CERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoCliente" AS ENUM ('ACTIVO', 'MOROSO', 'SUSPENDIDO', 'DESINSTALADO', 'PENDIENTE_ACTIVO', 'PAGO_PENDIENTE', 'ATRASADO', 'EN_INSTALACION');

-- CreateEnum
CREATE TYPE "EstadoServicio" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoFacturaInternet" AS ENUM ('PENDIENTE', 'PAGADA', 'ATRASADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoTicketSoporte" AS ENUM ('NUEVO', 'ABIERTA', 'EN_PROCESO', 'PENDIENTE', 'PENDIENTE_CLIENTE', 'PENDIENTE_TECNICO', 'RESUELTA', 'CANCELADA', 'ARCHIVADA', 'CERRADO', 'PENDIENTE_REVISION');

-- CreateEnum
CREATE TYPE "TipoFactura" AS ENUM ('INTERNET', 'SERVICIO_ADICIONAL');

-- CreateEnum
CREATE TYPE "PrioridadTicketSoporte" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('TECNICO', 'OFICINA', 'ADMIN', 'SUPER_ADMIN', 'COBRADOR');

-- CreateEnum
CREATE TYPE "EstadoClienteServicio" AS ENUM ('ACTIVO', 'SUSPENDIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'PAYPAL');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('PENDIENTE', 'PAGADA', 'ATRASADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MetodoPagoFacturaInternet" AS ENUM ('EFECTIVO', 'TARJETA', 'DEPOSITO', 'PAYPAL', 'PENDIENTE', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoMedia" AS ENUM ('IMAGEN', 'VIDEO', 'DOCUMENTO', 'AUDIO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoMedia" AS ENUM ('PENDIENTE', 'PROCESANDO', 'LISTO', 'FALLIDO');

-- CreateEnum
CREATE TYPE "ProveedorStorage" AS ENUM ('DO_SPACES', 'AWS_S3', 'GCS', 'AZURE', 'LOCAL');

-- CreateEnum
CREATE TYPE "CategoriaMedia" AS ENUM ('CLIENTE_GENERAL', 'CLIENTE_CONTRATO', 'CLIENTE_INSTALACION', 'SOPORTE_TICKET', 'OTRO');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "pbx" TEXT,
    "correo" TEXT,
    "sitioWeb" TEXT,
    "nit" TEXT,
    "logo1" TEXT,
    "logo2" TEXT,
    "logo3" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "contrasena" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionGlobal" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoEmpresa" (
    "id" SERIAL NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "egresos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIngresos" DOUBLE PRECISION NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaldoEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoCaja" (
    "id" SERIAL NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "egreso" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIngresos" DOUBLE PRECISION NOT NULL,
    "totalEgresos" DOUBLE PRECISION NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaldoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroCaja" (
    "id" SERIAL NOT NULL,
    "saldoInicial" DOUBLE PRECISION NOT NULL,
    "saldoFinal" DOUBLE PRECISION NOT NULL,
    "usuarioId" INTEGER,
    "cajaId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Municipio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "departamentoId" INTEGER NOT NULL,

    CONSTRAINT "Municipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "municipioId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" SERIAL NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "clienteId" INTEGER,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturacionZona" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "diaGeneracionFactura" INTEGER NOT NULL,
    "diaPago" INTEGER NOT NULL,
    "diaRecordatorio" INTEGER,
    "horaRecordatorio" TEXT,
    "enviarRecordatorio" BOOLEAN NOT NULL DEFAULT true,
    "diaCorte" INTEGER,
    "suspenderTrasFacturas" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "diaSegundoRecordatorio" INTEGER,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "llamada" BOOLEAN NOT NULL DEFAULT false,
    "sms" BOOLEAN NOT NULL DEFAULT false,
    "telegram" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp" BOOLEAN NOT NULL DEFAULT true,
    "enviarAvisoPago" BOOLEAN NOT NULL DEFAULT true,
    "enviarRecordatorio1" BOOLEAN NOT NULL DEFAULT true,
    "enviarRecordatorio2" BOOLEAN NOT NULL DEFAULT true,
    "enviarRecordatorioGeneracion" BOOLEAN NOT NULL DEFAULT true,
    "enviarSiTieneFacturasVencidas" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FacturacionZona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaMensaje" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoPlantilla" NOT NULL,
    "body" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantillaMensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaContrato" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantillaContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoServicio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoServicio" NOT NULL DEFAULT 'ACTIVO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoServicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoServicio" NOT NULL DEFAULT 'ACTIVO',
    "tipoServicioId" INTEGER,
    "empresaId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicioInternet" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "velocidad" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoServicio" NOT NULL DEFAULT 'ACTIVO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "ServicioInternet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteInternet" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "dpi" TEXT,
    "observaciones" TEXT,
    "contactoReferenciaNombre" TEXT,
    "contactoReferenciaTelefono" TEXT,
    "estadoCliente" "EstadoCliente" NOT NULL,
    "contrasenaWifi" TEXT,
    "ssidRouter" TEXT,
    "fechaInstalacion" TIMESTAMP(3),
    "asesorId" INTEGER,
    "municipioId" INTEGER,
    "departamentoId" INTEGER,
    "empresaId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "facturacionZonaId" INTEGER,
    "servicioInternetId" INTEGER,
    "sectorId" INTEGER,
    "nota" TEXT,

    CONSTRAINT "ClienteInternet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IP" (
    "id" SERIAL NOT NULL,
    "direccionIp" TEXT DEFAULT '192.168.1.1',
    "clienteId" INTEGER,
    "gateway" TEXT DEFAULT '192.168.1.1',
    "mascara" TEXT DEFAULT '255.255.255.0',

    CONSTRAINT "IP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fotos" (
    "id" SERIAL NOT NULL,
    "nombreFoto" TEXT NOT NULL,
    "url" TEXT,
    "clienteId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saldoCliente" (
    "id" SERIAL NOT NULL,
    "saldoPendiente" DOUBLE PRECISION DEFAULT 0,
    "saldoFavor" DOUBLE PRECISION DEFAULT 0,
    "totalPagos" DOUBLE PRECISION DEFAULT 0,
    "clienteId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "ultimoPago" TIMESTAMP(3),

    CONSTRAINT "saldoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoFisico" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER,
    "idContrato" TEXT NOT NULL,
    "fechaFirma" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "archivoContrato" TEXT,
    "creadoEn" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "mediaId" INTEGER,

    CONSTRAINT "ContratoFisico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoServicioInternet" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "fechaInstalacionProgramada" TIMESTAMP(3),
    "costoInstalacion" DOUBLE PRECISION,
    "fechaPago" TIMESTAMP(3),
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratoServicioInternet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteServicio" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "estado" "EstadoClienteServicio" NOT NULL DEFAULT 'ACTIVO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteServicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT,
    "telefono" TEXT,
    "fuente" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" INTEGER,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER,
    "albumId" INTEGER,
    "subidoPorId" INTEGER,
    "categoria" "CategoriaMedia" NOT NULL DEFAULT 'CLIENTE_GENERAL',
    "tipo" "TipoMedia" NOT NULL,
    "estado" "EstadoMedia" NOT NULL DEFAULT 'PENDIENTE',
    "bucket" TEXT,
    "region" TEXT,
    "key" TEXT NOT NULL,
    "cdnUrl" TEXT,
    "mimeType" TEXT,
    "extension" TEXT,
    "tamanioBytes" BIGINT,
    "ancho" INTEGER,
    "alto" INTEGER,
    "duracionSeg" INTEGER,
    "checksumSha256" VARCHAR(64),
    "titulo" TEXT,
    "descripcion" TEXT,
    "etiqueta" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "tomadoEn" TIMESTAMP(3),
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "eliminadoEn" TIMESTAMP(3),
    "metadatos" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumCliente" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "portadaId" INTEGER,
    "esGeneral" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlbumCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaInternet" (
    "id" SERIAL NOT NULL,
    "fechaPagoEsperada" TIMESTAMP(3),
    "fechaPagada" TIMESTAMP(3),
    "montoPago" DOUBLE PRECISION,
    "saldoPendiente" DOUBLE PRECISION DEFAULT 0,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "detalleFactura" TEXT,
    "nombreClienteFactura" TEXT,
    "facturacionZonaId" INTEGER,
    "estadoFacturaInternet" "StateFacturaInternet" NOT NULL DEFAULT 'PENDIENTE',
    "creadorId" INTEGER,
    "periodo" VARCHAR(6) NOT NULL,

    CONSTRAINT "FacturaInternet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tipoFactura" "TipoFactura" NOT NULL,
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "saldoPendiente" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" "EstadoFactura" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "facturaInternetId" INTEGER,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaServicio" (
    "id" SERIAL NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacturaServicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoFacturaInternet" (
    "id" SERIAL NOT NULL,
    "facturaInternetId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "montoPagado" DOUBLE PRECISION NOT NULL,
    "metodoPago" "MetodoPagoFacturaInternet" NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cobradorId" INTEGER,
    "numeroBoleta" TEXT,
    "codigoConfirmacion" TEXT,
    "facturaRutaId" INTEGER,
    "origen" "OrigenPago" NOT NULL DEFAULT 'RUTA',

    CONSTRAINT "PagoFacturaInternet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoFactura" (
    "id" SERIAL NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "montoPagado" DOUBLE PRECISION NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoFactura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordatorioPago" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "facturaInternetId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fechaEnviado" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "resultado" "ResultadoRecordatorioPago" NOT NULL,

    CONSTRAINT "RecordatorioPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaEliminada" (
    "id" SERIAL NOT NULL,
    "facturaInternetId" INTEGER,
    "periodo" TEXT NOT NULL,
    "montoPago" DOUBLE PRECISION NOT NULL,
    "fechaPagoEsperada" TIMESTAMP(3) NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "fechaEliminacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,

    CONSTRAINT "FacturaEliminada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ruta" (
    "id" SERIAL NOT NULL,
    "nombreRuta" TEXT NOT NULL,
    "cobradorId" INTEGER,
    "montoCobrado" INTEGER NOT NULL DEFAULT 0,
    "estadoRuta" "EstadoRuta" NOT NULL DEFAULT 'ACTIVO',
    "empresaId" INTEGER NOT NULL,
    "observaciones" TEXT,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ruta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RutaTurno" (
    "id" SERIAL NOT NULL,
    "rutaId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cobradorId" INTEGER,
    "estado" "EstadoRutaTurno" NOT NULL DEFAULT 'ABIERTA',
    "aperturaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cierreEn" TIMESTAMP(3),
    "notas" TEXT,
    "totalAsignadas" INTEGER NOT NULL DEFAULT 0,
    "totalCobradas" INTEGER NOT NULL DEFAULT 0,
    "sumaCobros" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "RutaTurno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaRuta" (
    "id" SERIAL NOT NULL,
    "rutaId" INTEGER NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "asignadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asignadaPorId" INTEGER,
    "estado" "EstadoAsignacionRuta" NOT NULL DEFAULT 'ASIGNADA',
    "motivo" TEXT,
    "cobradaEn" TIMESTAMP(3),
    "cobradaPorId" INTEGER,
    "observaciones" TEXT,

    CONSTRAINT "FacturaRuta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CobroRuta" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "rutaId" INTEGER NOT NULL,
    "montoCobrado" INTEGER NOT NULL,
    "estadoCobro" "EstadoCobro" NOT NULL,
    "fechaCobro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CobroRuta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketSoporte" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tecnicoId" INTEGER,
    "creadoPorId" INTEGER,
    "estado" "EstadoTicketSoporte" NOT NULL DEFAULT 'ABIERTA',
    "prioridad" "PrioridadTicketSoporte" NOT NULL DEFAULT 'MEDIA',
    "titulo" TEXT,
    "descripcion" TEXT,
    "fechaCierre" TIMESTAMP(3),
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAsignacion" TIMESTAMP(3),
    "fechaInicioAtencion" TIMESTAMP(3),
    "fechaResolucionTecnico" TIMESTAMP(3),

    CONSTRAINT "TicketSoporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoletaSoporte" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER,
    "conforme" BOOLEAN NOT NULL DEFAULT false,
    "firmadoPor" TEXT,
    "observaciones" TEXT,
    "fechaFirma" TIMESTAMP(3),
    "generadoPorId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoletaSoporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtiquetaTicket" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "actualizadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EtiquetaTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketEtiqueta" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "etiquetaId" INTEGER NOT NULL,
    "actualizadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketEtiqueta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeguimientoTicket" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeguimientoTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketSoporteTecnico" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "tecnicoId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketSoporteTecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaTecnicoTicket" (
    "id" SERIAL NOT NULL,
    "tecnicoId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "metaTickets" INTEGER NOT NULL,
    "ticketsResueltos" INTEGER NOT NULL DEFAULT 0,
    "cumplida" BOOLEAN NOT NULL DEFAULT false,
    "fechaCumplida" TIMESTAMP(3),
    "titulo" TEXT,
    "estado" "EstadoMetaTicket" NOT NULL,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetaTecnicoTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaTickets" (
    "id" SERIAL NOT NULL,
    "tituloMetaTicket" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "ticketsMeta" INTEGER NOT NULL,
    "ticketsAvance" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoMetaTickets" NOT NULL DEFAULT 'ACTIVO',
    "usuarioId" INTEGER,
    "cumplida" BOOLEAN NOT NULL DEFAULT false,
    "fechaCompletada" TIMESTAMP(3),

    CONSTRAINT "MetaTickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaEntrada" TIMESTAMP(3) NOT NULL,
    "horaSalida" TIMESTAMP(3),
    "minutosTarde" INTEGER,
    "trabajoCompleto" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClienteInternetToRuta" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ClienteInternetToRuta_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nombre_key" ON "Empresa"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionGlobal_clave_key" ON "ConfiguracionGlobal"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoEmpresa_empresaId_key" ON "SaldoEmpresa"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoCaja_empresaId_key" ON "SaldoCaja"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_nombre_key" ON "Departamento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_nombre_key" ON "Municipio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Ubicacion_clienteId_key" ON "Ubicacion"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoServicio_nombre_key" ON "TipoServicio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "IP_clienteId_key" ON "IP"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "saldoCliente_clienteId_key" ON "saldoCliente"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "ContratoFisico_clienteId_key" ON "ContratoFisico"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "ContratoFisico_idContrato_key" ON "ContratoFisico"("idContrato");

-- CreateIndex
CREATE UNIQUE INDEX "ContratoServicioInternet_clienteId_key" ON "ContratoServicioInternet"("clienteId");

-- CreateIndex
CREATE INDEX "Media_clienteId_albumId_creadoEn_idx" ON "Media"("clienteId", "albumId", "creadoEn" DESC);

-- CreateIndex
CREATE INDEX "Media_empresaId_categoria_tipo_idx" ON "Media"("empresaId", "categoria", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Media_bucket_key_key" ON "Media"("bucket", "key");

-- CreateIndex
CREATE INDEX "AlbumCliente_clienteId_creadoEn_idx" ON "AlbumCliente"("clienteId", "creadoEn" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "AlbumCliente_clienteId_nombre_key" ON "AlbumCliente"("clienteId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "FacturaInternet_clienteId_facturacionZonaId_periodo_key" ON "FacturaInternet"("clienteId", "facturacionZonaId", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "PagoFacturaInternet_numeroBoleta_key" ON "PagoFacturaInternet"("numeroBoleta");

-- CreateIndex
CREATE UNIQUE INDEX "PagoFacturaInternet_codigoConfirmacion_key" ON "PagoFacturaInternet"("codigoConfirmacion");

-- CreateIndex
CREATE INDEX "PagoFacturaInternet_facturaRutaId_idx" ON "PagoFacturaInternet"("facturaRutaId");

-- CreateIndex
CREATE INDEX "PagoFacturaInternet_facturaInternetId_fechaPago_idx" ON "PagoFacturaInternet"("facturaInternetId", "fechaPago");

-- CreateIndex
CREATE INDEX "FacturaEliminada_usuarioId_idx" ON "FacturaEliminada"("usuarioId");

-- CreateIndex
CREATE INDEX "FacturaEliminada_facturaInternetId_idx" ON "FacturaEliminada"("facturaInternetId");

-- CreateIndex
CREATE INDEX "RutaTurno_estado_idx" ON "RutaTurno"("estado");

-- CreateIndex
CREATE INDEX "RutaTurno_cobradorId_idx" ON "RutaTurno"("cobradorId");

-- CreateIndex
CREATE UNIQUE INDEX "RutaTurno_rutaId_fecha_key" ON "RutaTurno"("rutaId", "fecha");

-- CreateIndex
CREATE INDEX "FacturaRuta_facturaId_estado_idx" ON "FacturaRuta"("facturaId", "estado");

-- CreateIndex
CREATE INDEX "FacturaRuta_rutaId_estado_idx" ON "FacturaRuta"("rutaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "FacturaRuta_rutaId_facturaId_key" ON "FacturaRuta"("rutaId", "facturaId");

-- CreateIndex
CREATE UNIQUE INDEX "BoletaSoporte_ticketId_key" ON "BoletaSoporte"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "EtiquetaTicket_nombre_key" ON "EtiquetaTicket"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "TicketEtiqueta_ticketId_etiquetaId_key" ON "TicketEtiqueta"("ticketId", "etiquetaId");

-- CreateIndex
CREATE INDEX "TicketSoporteTecnico_tecnicoId_idx" ON "TicketSoporteTecnico"("tecnicoId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketSoporteTecnico_ticketId_tecnicoId_key" ON "TicketSoporteTecnico"("ticketId", "tecnicoId");

-- CreateIndex
CREATE INDEX "MetaTecnicoTicket_tecnicoId_fechaInicio_fechaFin_idx" ON "MetaTecnicoTicket"("tecnicoId", "fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "Asistencia_usuarioId_fecha_idx" ON "Asistencia"("usuarioId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_usuarioId_fecha_key" ON "Asistencia"("usuarioId", "fecha");

-- CreateIndex
CREATE INDEX "_ClienteInternetToRuta_B_index" ON "_ClienteInternetToRuta"("B");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionGlobal" ADD CONSTRAINT "ConfiguracionGlobal_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoEmpresa" ADD CONSTRAINT "SaldoEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoCaja" ADD CONSTRAINT "SaldoCaja_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroCaja" ADD CONSTRAINT "RegistroCaja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "SaldoCaja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroCaja" ADD CONSTRAINT "RegistroCaja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Municipio" ADD CONSTRAINT "Municipio_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sector" ADD CONSTRAINT "Sector_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturacionZona" ADD CONSTRAINT "FacturacionZona_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaMensaje" ADD CONSTRAINT "PlantillaMensaje_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_tipoServicioId_fkey" FOREIGN KEY ("tipoServicioId") REFERENCES "TipoServicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioInternet" ADD CONSTRAINT "ServicioInternet_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_facturacionZonaId_fkey" FOREIGN KEY ("facturacionZonaId") REFERENCES "FacturacionZona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteInternet" ADD CONSTRAINT "ClienteInternet_servicioInternetId_fkey" FOREIGN KEY ("servicioInternetId") REFERENCES "ServicioInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IP" ADD CONSTRAINT "IP_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fotos" ADD CONSTRAINT "Fotos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saldoCliente" ADD CONSTRAINT "saldoCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoFisico" ADD CONSTRAINT "ContratoFisico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoFisico" ADD CONSTRAINT "ContratoFisico_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoServicioInternet" ADD CONSTRAINT "ContratoServicioInternet_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteServicio" ADD CONSTRAINT "ClienteServicio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteServicio" ADD CONSTRAINT "ClienteServicio_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "AlbumCliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumCliente" ADD CONSTRAINT "AlbumCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumCliente" ADD CONSTRAINT "AlbumCliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumCliente" ADD CONSTRAINT "AlbumCliente_portadaId_fkey" FOREIGN KEY ("portadaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaInternet" ADD CONSTRAINT "FacturaInternet_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaInternet" ADD CONSTRAINT "FacturaInternet_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaInternet" ADD CONSTRAINT "FacturaInternet_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaInternet" ADD CONSTRAINT "FacturaInternet_facturacionZonaId_fkey" FOREIGN KEY ("facturacionZonaId") REFERENCES "FacturacionZona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_facturaInternetId_fkey" FOREIGN KEY ("facturaInternetId") REFERENCES "FacturaInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaServicio" ADD CONSTRAINT "FacturaServicio_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaServicio" ADD CONSTRAINT "FacturaServicio_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoFacturaInternet" ADD CONSTRAINT "PagoFacturaInternet_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoFacturaInternet" ADD CONSTRAINT "PagoFacturaInternet_cobradorId_fkey" FOREIGN KEY ("cobradorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoFacturaInternet" ADD CONSTRAINT "PagoFacturaInternet_facturaInternetId_fkey" FOREIGN KEY ("facturaInternetId") REFERENCES "FacturaInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoFacturaInternet" ADD CONSTRAINT "PagoFacturaInternet_facturaRutaId_fkey" FOREIGN KEY ("facturaRutaId") REFERENCES "FacturaRuta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoFactura" ADD CONSTRAINT "PagoFactura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoFactura" ADD CONSTRAINT "PagoFactura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordatorioPago" ADD CONSTRAINT "RecordatorioPago_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordatorioPago" ADD CONSTRAINT "RecordatorioPago_facturaInternetId_fkey" FOREIGN KEY ("facturaInternetId") REFERENCES "FacturaInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaEliminada" ADD CONSTRAINT "FacturaEliminada_facturaInternetId_fkey" FOREIGN KEY ("facturaInternetId") REFERENCES "FacturaInternet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaEliminada" ADD CONSTRAINT "FacturaEliminada_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ruta" ADD CONSTRAINT "Ruta_cobradorId_fkey" FOREIGN KEY ("cobradorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ruta" ADD CONSTRAINT "Ruta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RutaTurno" ADD CONSTRAINT "RutaTurno_cobradorId_fkey" FOREIGN KEY ("cobradorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RutaTurno" ADD CONSTRAINT "RutaTurno_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaRuta" ADD CONSTRAINT "FacturaRuta_asignadaPorId_fkey" FOREIGN KEY ("asignadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaRuta" ADD CONSTRAINT "FacturaRuta_cobradaPorId_fkey" FOREIGN KEY ("cobradaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaRuta" ADD CONSTRAINT "FacturaRuta_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "FacturaInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaRuta" ADD CONSTRAINT "FacturaRuta_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobroRuta" ADD CONSTRAINT "CobroRuta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobroRuta" ADD CONSTRAINT "CobroRuta_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSoporte" ADD CONSTRAINT "TicketSoporte_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSoporte" ADD CONSTRAINT "TicketSoporte_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSoporte" ADD CONSTRAINT "TicketSoporte_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSoporte" ADD CONSTRAINT "TicketSoporte_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoletaSoporte" ADD CONSTRAINT "BoletaSoporte_generadoPorId_fkey" FOREIGN KEY ("generadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoletaSoporte" ADD CONSTRAINT "BoletaSoporte_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEtiqueta" ADD CONSTRAINT "TicketEtiqueta_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "EtiquetaTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEtiqueta" ADD CONSTRAINT "TicketEtiqueta_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoTicket" ADD CONSTRAINT "SeguimientoTicket_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoTicket" ADD CONSTRAINT "SeguimientoTicket_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSoporteTecnico" ADD CONSTRAINT "TicketSoporteTecnico_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSoporteTecnico" ADD CONSTRAINT "TicketSoporteTecnico_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketSoporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaTecnicoTicket" ADD CONSTRAINT "MetaTecnicoTicket_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaTickets" ADD CONSTRAINT "MetaTickets_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClienteInternetToRuta" ADD CONSTRAINT "_ClienteInternetToRuta_A_fkey" FOREIGN KEY ("A") REFERENCES "ClienteInternet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClienteInternetToRuta" ADD CONSTRAINT "_ClienteInternetToRuta_B_fkey" FOREIGN KEY ("B") REFERENCES "Ruta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
