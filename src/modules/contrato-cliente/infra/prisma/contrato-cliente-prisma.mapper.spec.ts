import { ContratoClienteEntity } from '../../domain/entities/contrato-cliente.entity';
import { ContratoClientePrismaMapper } from './contrato-cliente-prisma.mapper';

describe('ContratoClientePrismaMapper', () => {
  it('las fechas de negocio se guardan como el inicio del día en Guatemala', () => {
    const contrato = ContratoClienteEntity.create(
      { clienteId: 7, fechaPago: '2026-07-01' },
      new Date('2026-06-01T18:00:00.000Z'),
    );

    const datos = ContratoClientePrismaMapper.toCreatePersistence(contrato);

    expect(datos.fechaPago).toEqual(new Date('2026-07-01T06:00:00.000Z'));
    expect(datos.fechaInstalacionProgramada).toBeNull();
  });
});
