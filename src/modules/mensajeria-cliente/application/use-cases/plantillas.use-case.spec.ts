import {
  MensajeriaArchivoInvalidoError,
  MensajeriaPlantillaInvalidaError,
} from '../../domain/errors/mensajeria-cliente.errors';
import {
  ProveedorMensajesFake,
  ProveedorPlantillasFake,
} from '../../test/fakes/mensajeria-cliente.fake';
import { MensajeriaClienteFacade } from '../facade/mensajeria-cliente.facade';
import { CrearPlantillaImagenUseCase } from './crear-plantilla-imagen.use-case';
import { CrearPlantillaUseCase } from './crear-plantilla.use-case';
import { EliminarPlantillaUseCase } from './eliminar-plantilla.use-case';
import { EnviarPlantillaUseCase } from './enviar-plantilla.use-case';
import {
  SubirImagenPlantillaUseCase,
  TAMANO_MAXIMO_IMAGEN,
} from './subir-imagen-plantilla.use-case';

describe('Plantillas y avisos', () => {
  const proveedor = () => new ProveedorPlantillasFake();

  it('arma la plantilla de servicio con imagen', async () => {
    const plantillas = proveedor();

    await new CrearPlantillaImagenUseCase(
      new CrearPlantillaUseCase(plantillas),
    ).execute({
      name: 'aviso_imagen',
      language: 'es',
      headerHandle: 'h-1',
      bodyText: 'Hola',
      bodyExample: [[]],
    });

    expect(plantillas.creadas[0]).toEqual({
      name: 'aviso_imagen',
      language: 'es',
      category: 'UTILITY',
      components: [
        {
          type: 'HEADER',
          format: 'IMAGE',
          example: { header_handle: ['h-1'] },
        },
        { type: 'BODY', text: 'Hola' },
      ],
    });
  });

  it('no borra con un nombre que no es de plantilla', async () => {
    await expect(
      new EliminarPlantillaUseCase(proveedor()).execute({
        usuarioId: 1,
        nombre: '../me',
      }),
    ).rejects.toThrow(MensajeriaPlantillaInvalidaError);
  });

  it.each([
    null,
    { mimeType: 'image/gif', tamano: 10 },
    { mimeType: 'image/png', tamano: TAMANO_MAXIMO_IMAGEN + 1 },
  ])('no sube %p', async (cambio) => {
    const plantillas = proveedor();
    const archivo = cambio && {
      nombre: 'a',
      contenido: Buffer.from('x'),
      ...cambio,
    };

    await expect(
      new SubirImagenPlantillaUseCase(plantillas).execute(archivo),
    ).rejects.toThrow(MensajeriaArchivoInvalidoError);
    expect(plantillas.subidas).toHaveLength(0);
  });

  it('los avisos salen en español con sus variables', async () => {
    const mensajes = new ProveedorMensajesFake();
    const fachada = new MensajeriaClienteFacade(
      new EnviarPlantillaUseCase(mensajes),
    );
    const [telefono] = fachada.normalizarTelefonos(['50000001']);

    await expect(
      fachada.enviarPlantilla({
        telefono,
        plantilla: 'ticket',
        variables: ['Ana', '7'],
      }),
    ).resolves.toEqual({ mensajeId: 'm-1' });
    expect(mensajes.enviados[0]).toEqual({
      telefono: '50250000001',
      plantilla: 'ticket',
      idioma: 'es',
      variables: ['Ana', '7'],
    });
  });
});
