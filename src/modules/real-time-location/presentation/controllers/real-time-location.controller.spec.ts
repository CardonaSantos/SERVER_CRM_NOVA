// import { Test, TestingModule } from '@nestjs/testing';

// import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';

// import { TecnicoTrackingRealtimeView } from '../../domain/ports/tecnico-tracking-query.port';

// import { FinalizarTecnicoTrackingUseCase } from '../../application/use-cases/finalizar-tecnico-tracking.use-case';

// import { IniciarTecnicoTrackingUseCase } from '../../application/use-cases/iniciar-tecnico-tracking.use-case';

// import { ListarHistorialTecnicoTrackingUseCase } from '../../application/use-cases/listar-historial-tecnico-tracking.use-case';

// import { ListarTecnicosTrackingRealtimeUseCase } from '../../application/use-cases/listar-tecnicos-tracking-realtime.use-case';

// import { ListarUbicacionesAsistenciaTrackingUseCase } from '../../application/use-cases/listar-ubicaciones-asistencia-tracking.use-case';

// import { ObtenerDetalleAsistenciaTrackingUseCase } from '../../application/use-cases/obtener-detalle-asistencia-tracking.use-case';

// import { ObtenerEstadoTrackingTecnicoUseCase } from '../../application/use-cases/obtener-estado-tracking-tecnico.use-case';

// import { RegistrarUbicacionTecnicoUseCase } from '../../application/use-cases/registrar-ubicacion-tecnico.use-case';

// import { RealTimeLocationController } from './real-time-location.controller';

// describe('RealTimeLocationController', () => {
//   let controller: RealTimeLocationController;

//   const iniciarTracking = {
//     execute: jest.fn(),
//   };

//   const obtenerEstadoTracking = {
//     execute: jest.fn(),
//   };

//   const registrarUbicacion = {
//     execute: jest.fn(),
//   };

//   const finalizarTracking = {
//     execute: jest.fn(),
//   };

//   const listarHistorial = {
//     execute: jest.fn(),
//   };

//   const listarRealtime = {
//     execute: jest.fn(),
//   };

//   const obtenerDetalle = {
//     execute: jest.fn(),
//   };

//   const listarUbicaciones = {
//     execute: jest.fn(),
//   };

//   beforeEach(async () => {
//     jest.clearAllMocks();

//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [RealTimeLocationController],

//       providers: [
//         {
//           provide: IniciarTecnicoTrackingUseCase,
//           useValue: iniciarTracking,
//         },

//         {
//           provide: ObtenerEstadoTrackingTecnicoUseCase,
//           useValue: obtenerEstadoTracking,
//         },

//         {
//           provide: RegistrarUbicacionTecnicoUseCase,
//           useValue: registrarUbicacion,
//         },

//         {
//           provide: FinalizarTecnicoTrackingUseCase,
//           useValue: finalizarTracking,
//         },

//         {
//           provide: ListarHistorialTecnicoTrackingUseCase,
//           useValue: listarHistorial,
//         },

//         {
//           provide: ListarTecnicosTrackingRealtimeUseCase,
//           useValue: listarRealtime,
//         },

//         {
//           provide: ObtenerDetalleAsistenciaTrackingUseCase,
//           useValue: obtenerDetalle,
//         },

//         {
//           provide: ListarUbicacionesAsistenciaTrackingUseCase,
//           useValue: listarUbicaciones,
//         },
//       ],
//     }).compile();

//     controller = module.get<RealTimeLocationController>(
//       RealTimeLocationController,
//     );
//   });

//   it('debe estar definido', () => {
//     expect(controller).toBeDefined();
//   });

//   describe('getRealtimeTracking', () => {
//     it('debe devolver un arreglo vacío cuando no existen técnicos con tracking activo', async () => {
//       listarRealtime.execute.mockResolvedValue([]);

//       const result = await controller.getRealtimeTracking();

//       expect(result).toEqual([]);

//       expect(listarRealtime.execute).toHaveBeenCalledTimes(1);
//     });

//     it('debe devolver el snapshot realtime entregado por el caso de uso', async () => {
//       const realtimeView: TecnicoTrackingRealtimeView = {
//         tecnico: {
//           id: 15,

//           nombre: 'Técnico de prueba',

//           telefono: '55555555',

//           rol: 'TECNICO',

//           avatarUrl: null,
//         },

//         tracking: {
//           sesionId: 25,

//           asistenciaId: 30,

//           estado: EstadoTrackingTecnico.ACTIVA,

//           iniciadoEn: new Date('2026-09-01T13:00:00.000Z'),

//           ultimoHeartbeatEn: new Date('2026-09-01T13:15:00.000Z'),
//         },

//         ubicacion: {
//           latitud: 15.666148,

//           longitud: -91.709069,

//           precision: 5,

//           velocidad: 0,

//           bateria: 82,

//           capturadoEn: new Date('2026-09-01T13:14:58.000Z'),

//           recibidoEn: new Date('2026-09-01T13:15:00.000Z'),
//         },

//         actividad: {
//           ticketsEnProceso: [
//             {
//               id: 100,

//               titulo: 'Ticket de prueba',

//               estado: 'EN_PROCESO',

//               prioridad: 'MEDIA',
//             },
//           ],
//         },
//       };

//       listarRealtime.execute.mockResolvedValue([realtimeView]);

//       const result = await controller.getRealtimeTracking();

//       expect(result).toEqual([realtimeView]);

//       expect(listarRealtime.execute).toHaveBeenCalledTimes(1);
//     });
//   });
// });
