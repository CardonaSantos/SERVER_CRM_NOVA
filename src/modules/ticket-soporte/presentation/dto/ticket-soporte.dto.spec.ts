import { ValidacionGlobalPipe } from 'src/common/validacion/validacion-global.pipe';
import { ActualizarTicketDto } from './actualizar-ticket.dto';
import { CancelarTicketDto } from './cancelar-ticket.dto';
import { CrearTicketDto } from './crear-ticket.dto';
import { ListarTicketsQueryDto } from './listar-tickets-query.dto';

const pipe = new ValidacionGlobalPipe();

const pasar = (valor: object, metatype: new () => object, type = 'body') =>
  pipe.transform(valor, { type: type as 'body', metatype });

describe('DTO de tickets', () => {
  it('lee los filtros como los envía un navegador', async () => {
    await expect(
      pasar(
        {
          bandeja: 'RESUELTOS',
          tecnicoIds: ['1', '2'],
          sectorIds: '3',
          prioridades: 'ALTA,URGENTE',
          sinTecnico: 'true',
          desde: '2026-11-01',
          page: '2',
          limit: '25',
        },
        ListarTicketsQueryDto,
        'query',
      ),
    ).resolves.toMatchObject({
      tecnicoIds: [1, 2],
      sectorIds: [3],
      prioridades: ['ALTA', 'URGENTE'],
      sinTecnico: true,
      page: 2,
      limit: 25,
    });
  });

  it.each([
    { tecnicoIds: 'uno' },
    { desde: '01/11/2026' },
    { hasta: '2026-02-31' },
    { bandeja: 'inbox' },
    { vista: 'lista' },
  ])('rechaza filtros inválidos: %o', async (query) => {
    await expect(
      pasar(query, ListarTicketsQueryDto, 'query'),
    ).rejects.toBeDefined();
  });

  it('al crear no admite estado ni usuario del navegador', async () => {
    await expect(
      pasar({ titulo: 'x', tecnicoId: null }, CrearTicketDto),
    ).resolves.toBeDefined();
    await expect(
      pasar({ titulo: 'x', estado: 'RESUELTA' }, CrearTicketDto),
    ).rejects.toBeDefined();
    await expect(
      pasar({ titulo: 'x', userId: 1 }, CrearTicketDto),
    ).rejects.toBeDefined();
  });

  it('al editar admite null solo donde significa quitar', async () => {
    await expect(
      pasar(
        { clienteId: null, tecnicoId: null, descripcion: null },
        ActualizarTicketDto,
      ),
    ).resolves.toBeDefined();

    for (const cuerpo of [
      { titulo: null },
      { prioridad: null },
      { apoyoIds: null },
      { status: 'RESUELTA' },
    ]) {
      await expect(pasar(cuerpo, ActualizarTicketDto)).rejects.toBeDefined();
    }
  });

  it('cancelar exige un motivo', async () => {
    await expect(
      pasar({ motivo: '   ' }, CancelarTicketDto),
    ).rejects.toBeDefined();
  });
});
