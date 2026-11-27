import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import {
  ContratoClienteNoEncontradoError,
  ContratoClienteYaExisteError,
  ContratoInstalacionNoEncontradaError,
  PlantillaContratoNoEncontradaError,
} from '../../domain/errors/contrato-cliente.errors';
import {
  ContratoClienteRepositoryFake,
  datosDocumento,
  PlantillaContratoRepositoryFake,
} from '../../test/fakes/contrato-cliente.fake';
import { CrearContratoClienteUseCase } from './crear-contrato-cliente.use-case';
import { CrearPlantillaContratoUseCase } from './crear-plantilla-contrato.use-case';
import { EditarPlantillaContratoUseCase } from './editar-plantilla-contrato.use-case';
import { EliminarPlantillaContratoUseCase } from './eliminar-plantilla-contrato.use-case';
import { ObtenerDocumentoContratoUseCase } from './obtener-documento-contrato.use-case';

const reloj = new RelojFijo('2026-11-27T18:00:00.000Z');

describe('contratos de clientes', () => {
  let contratos: ContratoClienteRepositoryFake;
  let plantillas: PlantillaContratoRepositoryFake;

  beforeEach(() => {
    contratos = new ContratoClienteRepositoryFake([7]);
    plantillas = new PlantillaContratoRepositoryFake();
  });

  const crearPlantilla = () =>
    new CrearPlantillaContratoUseCase(plantillas, reloj).execute({
      nombre: 'Hogar',
      body: 'Yo, [nombre_cliente]',
      empresaId: 1,
    });

  it('crea un solo contrato por cliente vigente', async () => {
    const crear = new CrearContratoClienteUseCase(contratos, reloj);

    const contrato = await crear.execute({ clienteId: 7 });

    expect(contrato.id).toBe(1);
    await expect(crear.execute({ clienteId: 7 })).rejects.toThrow(
      ContratoClienteYaExisteError,
    );
    await expect(crear.execute({ clienteId: 99 })).rejects.toThrow(
      ContratoClienteNoEncontradoError,
    );
  });

  it('edita y elimina plantillas, y avisa si no existen', async () => {
    const { id } = await crearPlantilla();
    const editar = new EditarPlantillaContratoUseCase(plantillas, reloj);
    const eliminar = new EliminarPlantillaContratoUseCase(plantillas);

    const editada = await editar.execute({ plantillaId: id!, body: 'Nuevo' });
    expect(editada.toPrimitives()).toMatchObject({
      nombre: 'Hogar',
      body: 'Nuevo',
    });

    await eliminar.execute({ plantillaId: id!, usuarioId: 1 });
    await expect(
      eliminar.execute({ plantillaId: id!, usuarioId: 1 }),
    ).rejects.toThrow(PlantillaContratoNoEncontradaError);
    await expect(editar.execute({ plantillaId: id! })).rejects.toThrow(
      PlantillaContratoNoEncontradaError,
    );
  });

  it('arma el documento o dice qué falta', async () => {
    const { id } = await crearPlantilla();
    const obtener = new ObtenerDocumentoContratoUseCase(
      {
        findDatos: (instalacionId) =>
          Promise.resolve(instalacionId === 40 ? datosDocumento() : null),
      },
      plantillas,
      reloj,
    );

    const documento = await obtener.execute({
      instalacionId: 40,
      plantillaId: id!,
    });

    expect(documento.documento.contenido).toBe('Yo, Ana Pérez');
    await expect(
      obtener.execute({ instalacionId: 41, plantillaId: id! }),
    ).rejects.toThrow(ContratoInstalacionNoEncontradaError);
    await expect(
      obtener.execute({ instalacionId: 40, plantillaId: 99 }),
    ).rejects.toThrow(PlantillaContratoNoEncontradaError);
  });
});
