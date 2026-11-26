import { UnidadDeTrabajoEnMemoria } from 'src/common/transaccion/unidad-de-trabajo-en-memoria';
import { ClienteFacadePort } from 'src/modules/cliente/public/cliente.facade.port';
import { PppoeAccesoInternetFacadePort } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';
import {
  ClienteDesinstalacionRepositoryFake,
  FIN,
} from '../../test/fakes/cliente-desinstalacion-repository.fake';
import { ClienteFacadeFake } from '../../test/fakes/cliente-facade.fake';
import { PppoeAccesoInternetFacadeFake } from '../../test/fakes/pppoe-acceso-internet-facade.fake';
import { CerrarDesinstalacionService } from './cerrar-desinstalacion.service';

describe('CerrarDesinstalacionService', () => {
  let desinstalaciones: ClienteDesinstalacionRepositoryFake;
  let accesos: PppoeAccesoInternetFacadeFake;
  let clientes: ClienteFacadeFake;
  let servicio: CerrarDesinstalacionService;

  beforeEach(() => {
    desinstalaciones = new ClienteDesinstalacionRepositoryFake();
    accesos = new PppoeAccesoInternetFacadeFake();
    clientes = new ClienteFacadeFake();
    servicio = new CerrarDesinstalacionService(
      desinstalaciones,
      accesos as unknown as PppoeAccesoInternetFacadePort,
      clientes as unknown as ClienteFacadePort,
      new UnidadDeTrabajoEnMemoria(),
    );
  });

  function acceso(estado: EstadoAccesoInternet) {
    return accesos.sembrar({
      estado,
      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
    });
  }

  function completada(accesoInternetId: number, tipo?: string) {
    return desinstalaciones.sembrar(EstadoDesinstalacionCliente.COMPLETADA, {
      accesoInternetId,
      ejecutadoPorId: 3,
      ...(tipo && { tipo }),
    });
  }

  it.each(Object.values(TipoDesinstalacionCliente))(
    'una desinstalación %s deja al cliente desinstalado en su fecha de cierre',
    async (tipo) => {
      const baja = acceso(EstadoAccesoInternet.BAJA);

      await servicio.guardarCompletada(completada(baja.id, tipo));

      expect(clientes.desinstalados).toEqual([
        expect.objectContaining({
          empresaId: 1,
          clienteId: 7,
          fecha: FIN,
          cambiadoPorId: 3,
        }),
      ]);
    },
  );

  it('si el acceso retirado aún no quedó en baja, igual marca al cliente', async () => {
    const pendiente = acceso(EstadoAccesoInternet.ACTIVO);

    await servicio.guardarCompletada(completada(pendiente.id));

    expect(clientes.desinstalados).toHaveLength(1);
  });

  it('si el cliente conserva otro acceso vigente, no cambia', async () => {
    const baja = acceso(EstadoAccesoInternet.BAJA);
    acceso(EstadoAccesoInternet.ACTIVO);

    await servicio.guardarCompletada(completada(baja.id));

    expect(clientes.desinstalados).toHaveLength(0);
    expect(desinstalaciones.guardados).toBe(1);
  });
});
