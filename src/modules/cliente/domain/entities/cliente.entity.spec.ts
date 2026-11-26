import { clienteProps } from '../../test/fakes/cliente-repository.fake';
import {
  EstadoOperativoCliente,
  EstadoOperativoLegacy,
} from '../enums/estado-operativo-cliente.enum';
import {
  ClienteDatosInvalidosError,
  ClienteEliminadoError,
} from '../errors/cliente.errors';
import { ClienteEntity } from './cliente.entity';

const AHORA = new Date('2026-11-26T18:00:00.000Z');
const ANTES = new Date('2026-05-01T18:00:00.000Z');
const { ACTIVO, SUSPENDIDO, DESINSTALADO } = EstadoOperativoCliente;

const cargar = (extra = {}) => ClienteEntity.hydrate(clienteProps(extra));

describe('ClienteEntity', () => {
  describe('create', () => {
    it('limpia los textos y arma el nombre de búsqueda sin tildes', () => {
      const cliente = ClienteEntity.create(
        {
          nombre: '  José  ',
          apellidos: ' Álvarez   Núñez ',
          telefono: '   ',
          estadoInicial: ACTIVO,
          empresaId: 1,
        },
        AHORA,
      );

      expect(cliente.toPrimitives()).toMatchObject({
        nombre: 'José',
        apellidos: 'Álvarez   Núñez',
        telefono: null,
        searchNombre: 'jose alvarez nunez',
        empresaId: 1,
        isEliminado: false,
        creadoEn: AHORA,
      });
    });

    it('exige nombre y un estado propio de un alta', () => {
      expect(() =>
        ClienteEntity.create({ nombre: ' ', estadoInicial: ACTIVO }, AHORA),
      ).toThrow(ClienteDatosInvalidosError);
      expect(() =>
        ClienteEntity.create(
          { nombre: 'Ana', estadoInicial: DESINSTALADO as never },
          AHORA,
        ),
      ).toThrow(ClienteDatosInvalidosError);
    });
  });

  describe('edición', () => {
    it('solo marca lo que cambió; lo no enviado no se toca', () => {
      const cliente = cargar({ telefono: '12345678', dpi: '1' });

      cliente.actualizarPerfil({ dpi: '', direccion: 'Zona 1' });

      expect(cliente.getChangedPrimitives()).toEqual({
        dpi: null,
        direccion: 'Zona 1',
      });
    });

    it('al cambiar el nombre actualiza el texto de búsqueda', () => {
      const cliente = cargar();

      cliente.actualizarPerfil({ apellidos: 'Gómez' });

      expect(cliente.getChangedPrimitives().searchNombre).toBe('maria gomez');
    });

    it('rechaza asignaciones inválidas', () => {
      expect(() => cargar().actualizarAsignaciones({ sectorId: 0 })).toThrow(
        ClienteDatosInvalidosError,
      );
    });

    it('un cliente eliminado no se edita', () => {
      const cliente = cargar({ isEliminado: true });

      expect(() => cliente.actualizarPerfil({ dpi: '2' })).toThrow(
        ClienteEliminadoError,
      );
    });
  });

  describe('ajuste manual del estado', () => {
    it('fija la fecha de baja una sola vez y la limpia al salir', () => {
      const cliente = cargar();
      cliente.ajustarEstadoOperativo(DESINSTALADO, AHORA);
      expect(cliente.desinstaladoEn).toEqual(AHORA);

      const yaBaja = cargar({
        estadoCliente: DESINSTALADO,
        desinstaladoEn: ANTES,
      });
      yaBaja.ajustarEstadoOperativo(DESINSTALADO, AHORA);
      expect(yaBaja.desinstaladoEn).toEqual(ANTES);

      yaBaja.ajustarEstadoOperativo(ACTIVO, AHORA);
      expect(yaBaja.desinstaladoEn).toBeNull();
    });

    it('no asigna estados de cobranza antiguos, pero respeta el que ya tenía', () => {
      expect(() =>
        cargar().ajustarEstadoOperativo(EstadoOperativoLegacy.MOROSO, AHORA),
      ).toThrow(ClienteDatosInvalidosError);

      const antiguo = cargar({ estadoCliente: EstadoOperativoLegacy.MOROSO });
      antiguo.ajustarEstadoOperativo(EstadoOperativoLegacy.MOROSO, AHORA);
      expect(antiguo.getChangedPrimitives()).toEqual({});
    });
  });

  describe('sincronización PPPoE', () => {
    it('reactivar a un desinstalado borra la fecha de baja', () => {
      const cliente = cargar({
        estadoCliente: DESINSTALADO,
        desinstaladoEn: ANTES,
      });

      expect(cliente.sincronizarEstadoOperativo(ACTIVO)).toBe(true);
      expect(cliente.desinstaladoEn).toBeNull();
    });

    it('repetir el estado no cambia nada', () => {
      const cliente = cargar({ estadoCliente: SUSPENDIDO });

      expect(cliente.sincronizarEstadoOperativo(SUSPENDIDO)).toBe(false);
      expect(cliente.getChangedPrimitives()).toEqual({});
    });
  });

  describe('desinstalación y borrado lógico', () => {
    it('conserva la primera fecha de baja', () => {
      const cliente = cargar();

      expect(cliente.marcarDesinstalado(ANTES)).toBe(true);
      expect(cliente.marcarDesinstalado(AHORA)).toBe(false);
      expect(cliente.desinstaladoEn).toEqual(ANTES);
    });

    it('elimina sin perder datos y no se elimina dos veces', () => {
      const cliente = cargar();

      cliente.eliminar({ actorId: 4, fecha: AHORA });

      expect(cliente.getChangedPrimitives()).toEqual({
        isEliminado: true,
        eliminadoEn: AHORA,
        eliminadoPorId: 4,
      });
      expect(() => cliente.eliminar({ actorId: 4, fecha: AHORA })).toThrow(
        ClienteEliminadoError,
      );
    });
  });
});
