import { RelojFijo } from 'src/common/reloj/reloj-fijo';
import { TicketConformidadResultado } from '../../domain/enums/ticket-conformidad-resultado.enum';
import { TicketFirmaOrigen } from '../../domain/enums/ticket-firma-origen.enum';
import { TicketFirmaTipo } from '../../domain/enums/ticket-firma-tipo.enum';
import {
  TicketConformidadContextoIncompletoError,
  TicketConformidadEstadoInvalidoError,
  TicketConformidadNoEncontradaError,
  TicketConformidadProhibidaError,
  TicketConformidadTicketNoEncontradoError,
  TicketFirmaDuplicadaError,
  TicketFirmaRequeridaError,
} from '../../domain/errors/ticket-soporte-conformidad.errors';
import { TicketConformidadRepositoryFake } from '../../test/fakes/ticket-conformidad-repository.fake';
import { TicketFirmaMediaFake } from '../../test/fakes/ticket-firma-media.fake';
import { TicketFirmaRepositoryFake } from '../../test/fakes/ticket-firma-repository.fake';
import { TicketSoporteContextoQueryFake } from '../../test/fakes/ticket-soporte-contexto-query.fake';
import {
  RegistrarFirmaTecnicoTicketConformidadInput,
  RegistrarFirmaTecnicoTicketConformidadUseCase,
} from './registrar-firma-tecnico-ticket-conformidad.use-case';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

const INPUT: RegistrarFirmaTecnicoTicketConformidadInput = {
  conformidadId: 1,
  usuarioFirmanteId: 7,
  nombreFirmante: 'Luis Pérez',
  firma: {
    bytes: Buffer.from('png'),
    mimeType: 'image/png',
    nombreArchivo: 'firma.png',
  },
  ipOrigen: '10.0.0.5',
  userAgent: 'Android',
};

describe('RegistrarFirmaTecnicoTicketConformidadUseCase', () => {
  let conformidades: TicketConformidadRepositoryFake;
  let firmas: TicketFirmaRepositoryFake;
  let tickets: TicketSoporteContextoQueryFake;
  let media: TicketFirmaMediaFake;
  let useCase: RegistrarFirmaTecnicoTicketConformidadUseCase;

  beforeEach(() => {
    conformidades = new TicketConformidadRepositoryFake();
    firmas = new TicketFirmaRepositoryFake();
    tickets = new TicketSoporteContextoQueryFake();
    media = new TicketFirmaMediaFake();
    useCase = new RegistrarFirmaTecnicoTicketConformidadUseCase(
      conformidades,
      firmas,
      tickets,
      media,
      new RelojFijo(AHORA),
    );
  });

  function armar() {
    tickets.sembrar();
    conformidades.sembrar();
  }

  it('guarda el archivo y la firma del técnico asignado con la hora del reloj', async () => {
    armar();

    const resultado = await useCase.execute(INPUT);

    expect(resultado).toEqual({
      conformidadId: 1,
      firmaId: 1,
      mediaId: 900,
      usuarioFirmanteId: 7,
      nombreFirmante: 'Luis Pérez',
      firmadoEn: AHORA,
    });
    expect(media.guardadas[0]).toMatchObject({
      empresaId: 1,
      clienteId: 5,
      ticketId: 10,
      conformidadId: 1,
      subidoPorId: 7,
    });
    expect(firmas.filas[0].toPrimitives()).toMatchObject({
      tipo: TicketFirmaTipo.TECNICO,
      origen: TicketFirmaOrigen.CRM,
      ipOrigen: '10.0.0.5',
      userAgent: 'Android',
    });
    expect(media.eliminadas).toHaveLength(0);
  });

  it('también firma cuando el cliente ya quedó conforme', async () => {
    tickets.sembrar();
    conformidades.sembrar({ resultado: TicketConformidadResultado.CONFORME });

    await expect(useCase.execute(INPUT)).resolves.toMatchObject({ firmaId: 1 });
  });

  it('sin archivo responde 400 de dominio y no toca nada', async () => {
    armar();

    await expect(useCase.execute({ ...INPUT, firma: null })).rejects.toThrow(
      TicketFirmaRequeridaError,
    );
    expect(media.guardadas).toHaveLength(0);
  });

  it('conformidad inexistente', async () => {
    tickets.sembrar();

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TicketConformidadNoEncontradaError,
    );
  });

  it('otro usuario que no es el técnico asignado recibe 403 y no se guarda nada', async () => {
    armar();

    await expect(
      useCase.execute({ ...INPUT, usuarioFirmanteId: 8 }),
    ).rejects.toThrow(TicketConformidadProhibidaError);
    expect(media.guardadas).toHaveLength(0);
    expect(firmas.filas).toHaveLength(0);
  });

  it('no se firma una conformidad que requiere retrabajo', async () => {
    tickets.sembrar();
    conformidades.sembrar({
      resultado: TicketConformidadResultado.REQUIERE_RETRABAJO,
    });

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TicketConformidadEstadoInvalidoError,
    );
  });

  it('una segunda firma técnica se rechaza antes de subir el archivo', async () => {
    armar();
    await useCase.execute(INPUT);
    media.guardadas.length = 0;

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TicketFirmaDuplicadaError,
    );
    expect(media.guardadas).toHaveLength(0);
  });

  it('un ticket sin empresa no permite guardar la firma', async () => {
    tickets.sembrar({ empresaId: null });
    conformidades.sembrar();

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TicketConformidadContextoIncompletoError,
    );
    expect(media.guardadas).toHaveLength(0);
  });

  it('un ticket que ya no existe no permite guardar la firma', async () => {
    conformidades.sembrar();

    await expect(useCase.execute(INPUT)).rejects.toThrow(
      TicketConformidadTicketNoEncontradoError,
    );
  });

  describe('compensación', () => {
    it('si guardar la firma falla borra la media y propaga el error original', async () => {
      armar();
      firmas.falla = new TicketFirmaDuplicadaError();

      await expect(useCase.execute(INPUT)).rejects.toThrow(
        TicketFirmaDuplicadaError,
      );

      expect(media.eliminadas).toEqual([{ mediaId: 900, empresaId: 1 }]);
    });

    it('si además falla el borrado, el error que sale es el de guardar la firma', async () => {
      armar();
      firmas.falla = new Error('BD caída');
      media.fallaAlEliminar = true;

      await expect(useCase.execute(INPUT)).rejects.toThrow('BD caída');
    });

    it('si falla la subida del archivo no hay nada que compensar', async () => {
      armar();
      media.fallaAlGuardar = new Error('Spaces caído');

      await expect(useCase.execute(INPUT)).rejects.toThrow('Spaces caído');
      expect(media.eliminadas).toHaveLength(0);
      expect(firmas.filas).toHaveLength(0);
    });
  });
});
