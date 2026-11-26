import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { TicketSoporteHistorialDatosInvalidosError } from '../../domain/errors/ticket-soporte-historial.errors';
import { TicketSoporteHistorialTipo } from '../../domain/enums/ticket-soporte-historial-tipo.enum';
import { TicketSoporteHistorialRepositoryFake } from '../../test/fakes/ticket-soporte-historial-repository.fake';
import { RegistrarActualizacionTicketUseCase } from './registrar-actualizacion-ticket.use-case';
import { RegistrarEventoTicketHistorialUseCase } from './registrar-evento-ticket-historial.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('registrar en el historial de tickets', () => {
  let repositorio: TicketSoporteHistorialRepositoryFake;
  let evento: RegistrarEventoTicketHistorialUseCase;
  let actualizacion: RegistrarActualizacionTicketUseCase;

  beforeEach(() => {
    repositorio = new TicketSoporteHistorialRepositoryFake();
    const reloj = new RelojFijo(AHORA);
    evento = new RegistrarEventoTicketHistorialUseCase(repositorio, reloj);
    actualizacion = new RegistrarActualizacionTicketUseCase(repositorio, reloj);
  });

  describe('evento', () => {
    it('guarda con la hora del reloj y la descripción por defecto del tipo', async () => {
      const id = await evento.execute({
        ticketId: 10,
        actor: { usuarioId: 3, usuarioNombre: 'Ana' },
        tipo: TicketSoporteHistorialTipo.CREADO,
      });

      expect(id).toBe(1);
      expect(repositorio.filas[0].toPrimitives()).toMatchObject({
        ticketId: 10,
        usuarioId: 3,
        usuarioNombre: 'Ana',
        tipo: TicketSoporteHistorialTipo.CREADO,
        descripcion: 'Ticket creado',
        creadoEn: AHORA,
      });
    });

    it('sin actor queda a nombre de Sistema', async () => {
      await evento.execute({
        ticketId: 10,
        tipo: TicketSoporteHistorialTipo.CANCELADO,
      });

      expect(repositorio.filas[0].usuarioId).toBeNull();
      expect(repositorio.filas[0].usuarioNombre).toBe('Sistema');
    });

    it('añade el detalle de los cambios a la descripción', async () => {
      await evento.execute({
        ticketId: 10,
        tipo: TicketSoporteHistorialTipo.ACTUALIZADO,
        descripcion: 'Cambio manual',
        cambios: [{ campo: 'estado', anterior: 'A', nuevo: 'B' }],
      });

      expect(repositorio.filas[0].descripcion).toBe(
        'Cambio manual · Estado: A → B',
      );
    });

    it('un ticket inválido se rechaza sin guardar', async () => {
      await expect(
        evento.execute({
          ticketId: 0,
          tipo: TicketSoporteHistorialTipo.CREADO,
        }),
      ).rejects.toThrow(TicketSoporteHistorialDatosInvalidosError);

      expect(repositorio.filas).toHaveLength(0);
    });
  });

  describe('actualización', () => {
    it('sin cambios reales no guarda nada', async () => {
      const id = await actualizacion.execute({
        ticketId: 10,
        cambios: [{ campo: 'titulo', anterior: 'a', nuevo: 'a' }],
      });

      expect(id).toBeNull();
      expect(repositorio.filas).toHaveLength(0);
    });

    it('infiere el tipo y deja solo los cambios reales en la descripción', async () => {
      const id = await actualizacion.execute({
        ticketId: 10,
        actor: { usuarioId: 3, usuarioNombre: 'Ana' },
        cambios: [
          { campo: 'prioridad', anterior: 'BAJA', nuevo: 'ALTA' },
          { campo: 'titulo', anterior: 'x', nuevo: 'x' },
        ],
      });

      expect(id).toBe(1);
      expect(repositorio.filas[0].tipo).toBe(
        TicketSoporteHistorialTipo.PRIORIDAD_CAMBIADA,
      );
      expect(repositorio.filas[0].descripcion).toBe(
        'Prioridad del ticket cambiada · Prioridad: BAJA → ALTA',
      );
      expect(repositorio.filas[0].creadoEn).toEqual(AHORA);
    });

    it('respeta el prefijo recibido', async () => {
      await actualizacion.execute({
        ticketId: 10,
        descripcion: 'Edición desde el panel',
        cambios: [{ campo: 'fijado', anterior: false, nuevo: true }],
      });

      expect(repositorio.filas[0].descripcion).toBe(
        'Edición desde el panel · Fijado: No → Sí',
      );
      expect(repositorio.filas[0].tipo).toBe(TicketSoporteHistorialTipo.FIJADO);
    });
  });
});
