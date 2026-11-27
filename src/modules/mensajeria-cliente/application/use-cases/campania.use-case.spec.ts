import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import {
  EstadoCampania,
  EstadoEnvio,
  MotivoEnvio,
} from '../../domain/enums/campania.enum';
import {
  CampaniaClienteNoEncontradoError,
  CampaniaEnCursoError,
  CampaniaNoReanudableError,
  CampaniaSinDestinatariosError,
  MensajeriaPlantillaNoEncontradaError,
  MensajeriaProveedorNoDisponibleError,
  MensajeriaProveedorRechazoError,
  MensajeriaSinConfirmacionError,
} from '../../domain/errors/mensajeria-cliente.errors';
import {
  CampaniasFake,
  DestinatariosFake,
  ProveedorMensajesFake,
  ProveedorPlantillasFake,
} from '../../test/fakes/mensajeria-cliente.fake';
import { DespachadorCampaniasService } from '../services/despachador-campanias.service';
import { CrearCampaniaUseCase } from './crear-campania.use-case';
import { EjecutarCampaniaUseCase } from './ejecutar-campania.use-case';
import { ObtenerCampaniaUseCase } from './obtener-campania.use-case';
import { ReanudarCampaniaUseCase } from './reanudar-campania.use-case';

describe('Campañas de WhatsApp', () => {
  let campanias: CampaniasFake;
  let destinatarios: DestinatariosFake;
  let mensajes: ProveedorMensajesFake;
  let plantillas: ProveedorPlantillasFake;
  let reloj: RelojFijo;
  let despachador: DespachadorCampaniasService;
  let crear: CrearCampaniaUseCase;
  let obtener: ObtenerCampaniaUseCase;
  let reanudar: ReanudarCampaniaUseCase;

  const telefono = (id: number) => `5025000000${id}`;
  const cliente = (id: number, cambios = {}) => ({
    id,
    telefono: `5000000${id}`,
    eliminado: false,
    whatsappActivo: true,
    ...cambios,
  });
  const pedido = (clienteIds: number[]) => ({
    usuarioId: 1,
    plantilla: 'aviso',
    idioma: 'es',
    clienteIds,
  });

  beforeEach(() => {
    campanias = new CampaniasFake();
    destinatarios = new DestinatariosFake();
    destinatarios.clientes = [1, 2, 3, 4, 5, 6, 7].map((id) => cliente(id));
    mensajes = new ProveedorMensajesFake();
    plantillas = new ProveedorPlantillasFake();
    reloj = new RelojFijo(new Date('2026-11-26T16:00:00.000Z'));
    despachador = new DespachadorCampaniasService(
      new EjecutarCampaniaUseCase(campanias, mensajes, reloj),
    );
    obtener = new ObtenerCampaniaUseCase(campanias, reloj);
    crear = new CrearCampaniaUseCase(
      plantillas,
      destinatarios,
      campanias,
      despachador,
      obtener,
      reloj,
    );
    reanudar = new ReanudarCampaniaUseCase(
      campanias,
      despachador,
      obtener,
      reloj,
    );
  });

  it('envía a cada cliente, omite con motivo y completa', async () => {
    destinatarios.clientes = [
      cliente(1),
      cliente(2, { whatsappActivo: false }),
      cliente(3, { eliminado: true }),
      cliente(4, { telefono: '' }),
      cliente(5, { telefono: '50000001' }),
    ];

    await crear.execute(pedido([5, 1, 2, 3, 4]));
    await despachador.esperar(1);

    expect(mensajes.enviados).toEqual([
      {
        telefono: telefono(1),
        plantilla: 'aviso',
        idioma: 'es',
        imagenUrl: null,
      },
    ]);
    expect(campanias.envios.map((e) => e.motivo)).toEqual([
      null,
      MotivoEnvio.WHATSAPP_DESACTIVADO,
      MotivoEnvio.CLIENTE_ELIMINADO,
      MotivoEnvio.SIN_TELEFONO_VALIDO,
      MotivoEnvio.TELEFONO_REPETIDO,
    ]);
    await expect(obtener.execute({ campaniaId: 1 })).resolves.toMatchObject({
      estado: EstadoCampania.COMPLETADA,
      totales: { total: 5, enviados: 1, omitidos: 4 },
    });
  });

  it('un rechazo no detiene a los demás', async () => {
    mensajes.fallos.set(
      telefono(1),
      new MensajeriaProveedorRechazoError('Número no válido.'),
    );

    await crear.execute(pedido([1, 2]));
    await despachador.esperar(1);

    expect(campanias.estados()).toEqual([
      EstadoEnvio.FALLIDO,
      EstadoEnvio.ENVIADO,
    ]);
    expect(campanias.envios[0].detalle).toBe('Número no válido.');
  });

  it('si WhatsApp no está disponible se detiene y se puede reanudar', async () => {
    mensajes.fallos.set(
      telefono(2),
      new MensajeriaProveedorNoDisponibleError(),
    );
    await crear.execute(pedido([1, 2, 3]));
    await despachador.esperar(1);

    expect(campanias.estados()).toEqual([
      EstadoEnvio.ENVIADO,
      EstadoEnvio.PENDIENTE,
      EstadoEnvio.PENDIENTE,
    ]);

    mensajes.fallos.clear();
    await reanudar.execute({ usuarioId: 1, campaniaId: 1 });
    await despachador.esperar(1);

    // Cada número salió una sola vez.
    expect(mensajes.enviados.map((m) => m.telefono)).toEqual(
      [1, 2, 3].map(telefono),
    );
    expect(campanias.campanias[0].estado).toBe(EstadoCampania.COMPLETADA);
  });

  it('para tras varias respuestas sin confirmar', async () => {
    for (const id of [1, 2, 3, 4, 5]) {
      mensajes.fallos.set(telefono(id), new MensajeriaSinConfirmacionError());
    }

    await crear.execute(pedido([1, 2, 3, 4, 5, 6]));
    await despachador.esperar(1);

    expect(campanias.campanias[0].estado).toBe(EstadoCampania.INTERRUMPIDA);
    expect(campanias.estados().slice(4)).toEqual([
      EstadoEnvio.SIN_CONFIRMAR,
      EstadoEnvio.PENDIENTE,
    ]);
  });

  it('solo una campaña a la vez; una detenida deja de contar', async () => {
    jest.spyOn(despachador, 'despachar').mockImplementation(() => undefined);
    await crear.execute(pedido([1]));

    await expect(crear.execute(pedido([2]))).rejects.toThrow(
      CampaniaEnCursoError,
    );
    await expect(
      reanudar.execute({ usuarioId: 1, campaniaId: 1 }),
    ).rejects.toThrow(CampaniaNoReanudableError);

    reloj.avanzar({ minutos: 6 });
    await expect(obtener.execute({ campaniaId: 1 })).resolves.toMatchObject({
      estado: EstadoCampania.INTERRUMPIDA,
    });
    await expect(crear.execute(pedido([2]))).resolves.toMatchObject({ id: 2 });
  });

  it('al reanudar, lo que quedó a medias no se reenvía', async () => {
    const espia = jest
      .spyOn(despachador, 'despachar')
      .mockImplementation(() => undefined);
    await crear.execute(pedido([1, 2]));
    await campanias.tomarSiguiente(1, reloj.ahora());
    espia.mockRestore();
    reloj.avanzar({ minutos: 6 });

    await reanudar.execute({ usuarioId: 1, campaniaId: 1 });
    await despachador.esperar(1);

    expect(campanias.estados()).toEqual([
      EstadoEnvio.SIN_CONFIRMAR,
      EstadoEnvio.ENVIADO,
    ]);
  });

  it.each([
    [
      'plantilla inexistente',
      { idioma: 'en' },
      MensajeriaPlantillaNoEncontradaError,
    ],
    [
      'cliente inexistente',
      { clienteIds: [1, 99] },
      CampaniaClienteNoEncontradoError,
    ],
  ])('rechaza %s sin guardar nada', async (_caso, cambio, error) => {
    await expect(crear.execute({ ...pedido([1]), ...cambio })).rejects.toThrow(
      error,
    );
    expect(campanias.campanias).toHaveLength(0);
  });

  it('no crea una campaña sin nadie a quien enviar', async () => {
    destinatarios.clientes = [cliente(1, { telefono: null })];

    await expect(crear.execute(pedido([1]))).rejects.toThrow(
      CampaniaSinDestinatariosError,
    );
    expect(campanias.campanias).toHaveLength(0);
  });
});
