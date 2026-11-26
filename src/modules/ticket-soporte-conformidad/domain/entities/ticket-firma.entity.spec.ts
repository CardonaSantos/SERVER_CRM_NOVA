import { TicketFirmaOrigen } from '../enums/ticket-firma-origen.enum';
import { TicketFirmaTipo } from '../enums/ticket-firma-tipo.enum';
import { TicketConformidadDatosInvalidosError } from '../errors/ticket-soporte-conformidad.errors';
import { TicketFirmaEntity } from './ticket-firma.entity';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

describe('TicketFirmaEntity', () => {
  describe('createTecnico', () => {
    const input = {
      conformidadId: 1,
      mediaId: 900,
      usuarioFirmanteId: 7,
      nombreFirmante: '  Luis Pérez ',
      ipOrigen: ' 10.0.0.5 ',
      userAgent: '   ',
    };

    it('nace desde el CRM con la fecha recibida y los textos recortados', () => {
      const firma = TicketFirmaEntity.createTecnico(input, AHORA);

      expect(firma.id).toBeNull();
      expect(firma.tipo).toBe(TicketFirmaTipo.TECNICO);
      expect(firma.esFirmaTecnico()).toBe(true);
      expect(firma.origen).toBe(TicketFirmaOrigen.CRM);
      expect(firma.usuarioFirmanteId).toBe(7);
      expect(firma.nombreFirmante).toBe('Luis Pérez');
      expect(firma.ipOrigen).toBe('10.0.0.5');
      expect(firma.userAgent).toBeNull();
      expect(firma.telefonoFirmante).toBeNull();
      expect(firma.firmadoEn).toEqual(AHORA);
    });

    it.each([
      ['conformidad', { conformidadId: 0 }],
      ['media', { mediaId: -1 }],
      ['usuario', { usuarioFirmanteId: 0 }],
      ['nombre', { nombreFirmante: '   ' }],
    ])('rechaza datos inválidos: %s', (_nombre, cambio) => {
      expect(() =>
        TicketFirmaEntity.createTecnico({ ...input, ...cambio }, AHORA),
      ).toThrow(TicketConformidadDatosInvalidosError);
    });
  });

  describe('createCliente', () => {
    it('exige nombre y teléfono y no lleva usuario', () => {
      const firma = TicketFirmaEntity.createCliente(
        {
          conformidadId: 1,
          mediaId: 900,
          nombreFirmante: 'Ana',
          telefonoFirmante: ' 5555-1111 ',
          origen: TicketFirmaOrigen.CRM,
        },
        AHORA,
      );

      expect(firma.esFirmaCliente()).toBe(true);
      expect(firma.usuarioFirmanteId).toBeNull();
      expect(firma.telefonoFirmante).toBe('5555-1111');

      expect(() =>
        TicketFirmaEntity.createCliente(
          {
            conformidadId: 1,
            mediaId: 900,
            nombreFirmante: 'Ana',
            telefonoFirmante: ' ',
            origen: TicketFirmaOrigen.CRM,
          },
          AHORA,
        ),
      ).toThrow(TicketConformidadDatosInvalidosError);
    });
  });

  describe('hydrate', () => {
    const base = {
      id: 4,
      conformidadId: 1,
      mediaId: 900,
      nombreFirmante: 'Ana',
      ipOrigen: null,
      userAgent: null,
      firmadoEn: AHORA,
    };

    it('reconstruye una firma histórica del cliente hecha desde el enlace público', () => {
      const firma = TicketFirmaEntity.hydrate({
        ...base,
        tipo: TicketFirmaTipo.CLIENTE,
        usuarioFirmanteId: null,
        telefonoFirmante: '5555-1111',
        origen: TicketFirmaOrigen.PUBLICO,
      });

      expect(firma.origen).toBe(TicketFirmaOrigen.PUBLICO);
      expect(firma.id).toBe(4);
    });

    it('rechaza una firma de cliente sin teléfono o con usuario', () => {
      expect(() =>
        TicketFirmaEntity.hydrate({
          ...base,
          tipo: TicketFirmaTipo.CLIENTE,
          usuarioFirmanteId: null,
          telefonoFirmante: null,
          origen: TicketFirmaOrigen.PUBLICO,
        }),
      ).toThrow(TicketConformidadDatosInvalidosError);
      expect(() =>
        TicketFirmaEntity.hydrate({
          ...base,
          tipo: TicketFirmaTipo.CLIENTE,
          usuarioFirmanteId: 7,
          telefonoFirmante: '5555',
          origen: TicketFirmaOrigen.PUBLICO,
        }),
      ).toThrow(TicketConformidadDatosInvalidosError);
    });

    it('rechaza una firma de técnico sin usuario o fuera del CRM', () => {
      expect(() =>
        TicketFirmaEntity.hydrate({
          ...base,
          tipo: TicketFirmaTipo.TECNICO,
          usuarioFirmanteId: null,
          telefonoFirmante: null,
          origen: TicketFirmaOrigen.CRM,
        }),
      ).toThrow(TicketConformidadDatosInvalidosError);
      expect(() =>
        TicketFirmaEntity.hydrate({
          ...base,
          tipo: TicketFirmaTipo.TECNICO,
          usuarioFirmanteId: 7,
          telefonoFirmante: null,
          origen: TicketFirmaOrigen.PUBLICO,
        }),
      ).toThrow(TicketConformidadDatosInvalidosError);
    });
  });
});
