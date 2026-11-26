import { PppoeAccesoInternetFacadePort } from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  AccesoInternetReadModel,
  EstadoAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';

type CrearInput = Parameters<PppoeAccesoInternetFacadePort['crear']>[0];

/** Accesos de internet en memoria; `crear` les asigna id. */
export class PppoeAccesoInternetFacadeFake
  implements Partial<PppoeAccesoInternetFacadePort>
{
  readonly accesos = new Map<number, AccesoInternetReadModel>();
  readonly creados: CrearInput[] = [];
  private siguienteId = 500;

  /** Un acceso del cliente ya existente. */
  sembrar(
    datos: Partial<AccesoInternetReadModel> &
      Pick<AccesoInternetReadModel, 'tecnologia' | 'metodoAutenticacion'>,
  ): AccesoInternetReadModel {
    const ahora = new Date('2026-01-01T00:00:00Z');
    const acceso: AccesoInternetReadModel = {
      id: this.siguienteId++,
      empresaId: 1,
      clienteId: 7,
      servicioInternetId: 3,
      estado: EstadoAccesoInternet.PENDIENTE,
      activadoEn: null,
      suspendidoEn: null,
      dadoDeBajaEn: null,
      creadoEn: ahora,
      actualizadoEn: ahora,
      ...datos,
    };

    this.accesos.set(acceso.id, acceso);

    return acceso;
  }

  crear(input: CrearInput): Promise<AccesoInternetReadModel> {
    this.creados.push(input);

    return Promise.resolve(
      this.sembrar({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        servicioInternetId: input.servicioInternetId ?? null,
        tecnologia: input.tecnologia,
        metodoAutenticacion: input.metodoAutenticacion,
      }),
    );
  }

  buscarDelCliente(params: {
    accesoInternetId: number;
    clienteId: number;
  }): Promise<AccesoInternetReadModel | null> {
    const acceso = this.accesos.get(params.accesoInternetId);

    return Promise.resolve(
      acceso && acceso.clienteId === params.clienteId ? acceso : null,
    );
  }
}
