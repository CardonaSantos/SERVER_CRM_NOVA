import { TicketSoporteHistorialNoEncontradoError } from '../../domain/errors/ticket-soporte-historial.errors';
import { TicketSoporteHistorialTipo } from '../../domain/enums/ticket-soporte-historial-tipo.enum';
import { TicketSoporteHistorialQueryFake } from '../../test/fakes/ticket-soporte-historial-query.fake';
import { ListarTicketSoporteHistorialUseCase } from './listar-ticket-soporte-historial.use-case';
import { ObtenerTicketSoporteHistorialUseCase } from './obtener-ticket-soporte-historial.use-case';

describe('consultar el historial de tickets', () => {
  let consulta: TicketSoporteHistorialQueryFake;

  beforeEach(() => {
    consulta = new TicketSoporteHistorialQueryFake();
    consulta.filas.push({
      id: 5,
      ticketId: 10,
      usuarioId: null,
      tipo: TicketSoporteHistorialTipo.CREADO,
      descripcion: 'Ticket creado',
      usuarioNombre: 'Sistema',
      creadoEn: new Date('2026-11-25T15:00:00.000Z'),
    });
  });

  describe('listar', () => {
    it('sin página ni límite usa la página 1 y 20 por página', async () => {
      const resultado = await new ListarTicketSoporteHistorialUseCase(
        consulta,
      ).execute({});

      expect(consulta.paginacionRecibida).toEqual({ page: 1, limit: 20 });
      expect(resultado.total).toBe(1);
    });

    it('recorta el límite a 100 y pasa los filtros sin la paginación', async () => {
      await new ListarTicketSoporteHistorialUseCase(consulta).execute({
        page: 3,
        limit: 500,
        ticketId: 10,
        tipo: TicketSoporteHistorialTipo.CREADO,
        orden: 'asc',
      });

      expect(consulta.paginacionRecibida).toEqual({ page: 3, limit: 100 });
      expect(consulta.filtrosRecibidos).toEqual({
        ticketId: 10,
        tipo: TicketSoporteHistorialTipo.CREADO,
        orden: 'asc',
      });
    });
  });

  describe('obtener', () => {
    it('devuelve la entrada', async () => {
      const resumen = await new ObtenerTicketSoporteHistorialUseCase(
        consulta,
      ).execute(5);

      expect(resumen.descripcion).toBe('Ticket creado');
    });

    it('una entrada inexistente es 404 de dominio', async () => {
      await expect(
        new ObtenerTicketSoporteHistorialUseCase(consulta).execute(99),
      ).rejects.toThrow(TicketSoporteHistorialNoEncontradoError);
    });
  });
});
