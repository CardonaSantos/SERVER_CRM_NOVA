import { EstadoCobranzaCliente } from '../enums/estado-cobranza-cliente.enum';
import {
  EstadoClientePersistido,
  EstadoOperativoCliente,
  EstadoOperativoLegacy,
} from '../enums/estado-operativo-cliente.enum';
import { EstadoServicioMikrotik } from '../enums/estado-servicio-mikrotik.enum';
import {
  ClienteDatosInvalidosError,
  ClienteEliminadoError,
} from '../errors/cliente.errors';
import { resolverEstadoServicioMikrotik } from '../policies/estado-servicio-mikrotik.policy';
import { construirNombreBusqueda } from '../policies/nombre-busqueda.policy';
import {
  ActualizarAsignacionesCliente,
  ActualizarPerfilCliente,
  ClienteProps,
  CrearClienteProps,
} from '../props/cliente.props';

const ESTADOS_DE_ALTA: EstadoOperativoCliente[] = [
  EstadoOperativoCliente.ACTIVO,
  EstadoOperativoCliente.PENDIENTE_ACTIVO,
  EstadoOperativoCliente.EN_INSTALACION,
];

const CAMPOS_DE_TEXTO = [
  'apellidos',
  'dpi',
  'observaciones',
  'nota',
  'telefono',
  'direccion',
  'contactoReferenciaNombre',
  'contactoReferenciaTelefono',
  'ssidRouter',
] as const;

const CAMPOS_DE_ASIGNACION = [
  'empresaId',
  'asesorId',
  'servicioInternetId',
  'sectorId',
  'municipioId',
  'departamentoId',
  'facturacionZonaId',
  'mikrotikRouterId',
] as const;

const copia = (fecha: Date | null): Date | null =>
  fecha ? new Date(fecha.getTime()) : null;

/**
 * Cliente de internet. Solo guarda lo que cambió (`getChangedPrimitives`), para
 * no pisar escrituras de otros módulos sobre la misma fila.
 */
export class ClienteEntity {
  private readonly cambios = new Set<keyof ClienteProps>();
  private readonly estadoAlCargar: EstadoClientePersistido;

  private constructor(private readonly props: ClienteProps) {
    this.estadoAlCargar = props.estadoCliente;
  }

  static create(input: CrearClienteProps, ahora: Date): ClienteEntity {
    if (!ESTADOS_DE_ALTA.includes(input.estadoInicial)) {
      throw new ClienteDatosInvalidosError(
        'El estado inicial de un cliente nuevo no es válido.',
      );
    }

    const entity = new ClienteEntity({
      id: null,
      empresaId: null,
      asesorId: null,
      nombre: ClienteEntity.nombreValido(input.nombre),
      apellidos: null,
      dpi: null,
      observaciones: null,
      nota: null,
      telefono: null,
      direccion: null,
      contactoReferenciaNombre: null,
      contactoReferenciaTelefono: null,
      contrasenaWifi: null,
      ssidRouter: null,
      fechaInstalacion: null,
      servicioInternetId: null,
      sectorId: null,
      enviarRecordatorio: true,
      isEliminado: false,
      eliminadoEn: null,
      estadoCliente: input.estadoInicial,
      estadoCobranza: EstadoCobranzaCliente.AL_DIA,
      municipioId: null,
      departamentoId: null,
      facturacionZonaId: null,
      mikrotikRouterId: null,
      estadoServicioMikrotik: EstadoServicioMikrotik.SIN_MIKROTIK,
      searchNombre: null,
      creadoEn: new Date(ahora),
      actualizadoEn: new Date(ahora),
      desinstaladoEn: null,
      eliminadoPorId: null,
      motivoEliminacion: null,
      comentarioEliminacion: null,
    });

    entity.actualizarPerfil(input);
    entity.actualizarAsignaciones(input);
    entity.set(
      'searchNombre',
      construirNombreBusqueda(entity.props.nombre, entity.props.apellidos),
    );

    return entity;
  }

  /** Reconstruye desde persistencia sin imponer reglas nuevas a filas antiguas. */
  static hydrate(props: ClienteProps): ClienteEntity {
    if (props.id === null) {
      throw new ClienteDatosInvalidosError(
        'El cliente no tiene identificador.',
      );
    }

    return new ClienteEntity({
      ...props,
      creadoEn: new Date(props.creadoEn),
      actualizadoEn: new Date(props.actualizadoEn),
      fechaInstalacion: copia(props.fechaInstalacion),
      eliminadoEn: copia(props.eliminadoEn),
      desinstaladoEn: copia(props.desinstaladoEn),
    });
  }

  get id(): number | null {
    return this.props.id;
  }
  get empresaId(): number | null {
    return this.props.empresaId;
  }
  get estadoCliente(): EstadoClientePersistido {
    return this.props.estadoCliente;
  }
  /** El estado con el que se leyó: condición para guardar sin pisar a otro. */
  get estadoOriginal(): EstadoClientePersistido {
    return this.estadoAlCargar;
  }
  get isEliminado(): boolean {
    return this.props.isEliminado;
  }
  get desinstaladoEn(): Date | null {
    return copia(this.props.desinstaladoEn);
  }

  /** Incluye la contraseña wifi: no se expone sin pasar por un presenter. */
  toPrimitives(): ClienteProps {
    return {
      ...this.props,
      creadoEn: new Date(this.props.creadoEn),
      actualizadoEn: new Date(this.props.actualizadoEn),
      fechaInstalacion: copia(this.props.fechaInstalacion),
      eliminadoEn: copia(this.props.eliminadoEn),
      desinstaladoEn: copia(this.props.desinstaladoEn),
    };
  }

  getChangedPrimitives(): Partial<ClienteProps> {
    const actuales = this.toPrimitives();
    const delta: Record<string, unknown> = {};

    for (const campo of this.cambios) delta[campo] = actuales[campo];

    return delta as Partial<ClienteProps>;
  }

  /** `undefined` no se toca; un texto vacío borra el dato. */
  actualizarPerfil(input: ActualizarPerfilCliente): void {
    this.assertEditable();

    if (input.nombre !== undefined) {
      this.set('nombre', ClienteEntity.nombreValido(input.nombre));
    }

    for (const campo of CAMPOS_DE_TEXTO) {
      const valor = input[campo];
      if (valor !== undefined) this.set(campo, valor?.trim() || null);
    }

    // La contraseña wifi se guarda tal como llega.
    if (input.contrasenaWifi !== undefined) {
      this.set('contrasenaWifi', input.contrasenaWifi);
    }
    if (input.fechaInstalacion !== undefined) {
      this.set('fechaInstalacion', copia(input.fechaInstalacion));
    }
    if (input.enviarRecordatorio !== undefined) {
      this.set('enviarRecordatorio', input.enviarRecordatorio);
    }
    if (this.cambios.has('nombre') || this.cambios.has('apellidos')) {
      this.set(
        'searchNombre',
        construirNombreBusqueda(this.props.nombre, this.props.apellidos),
      );
    }
  }

  actualizarAsignaciones(input: ActualizarAsignacionesCliente): void {
    this.assertEditable();
    const routerAnterior = this.props.mikrotikRouterId;

    for (const campo of CAMPOS_DE_ASIGNACION) {
      const valor = input[campo];
      if (valor === undefined) continue;
      if (valor !== null && (!Number.isInteger(valor) || valor <= 0)) {
        throw new ClienteDatosInvalidosError(
          'Una de las asignaciones del cliente no es válida.',
        );
      }
      this.set(campo, valor);
    }

    if (input.mikrotikRouterId !== undefined) {
      this.set(
        'estadoServicioMikrotik',
        resolverEstadoServicioMikrotik({
          routerAnterior,
          routerNuevo: input.mikrotikRouterId,
          estadoActual: this.props.estadoServicioMikrotik,
        }),
      );
    }
  }

  /** La cobranza con la que nace un cliente, según su primera factura. */
  registrarCobranzaInicial(estado: EstadoCobranzaCliente): void {
    this.set('estadoCobranza', estado);
  }

  /** Ajuste hecho por una persona desde la edición del cliente. */
  ajustarEstadoOperativo(estado: EstadoClientePersistido, fecha: Date): void {
    this.assertEditable();

    if (
      estado !== this.props.estadoCliente &&
      Object.values<string>(EstadoOperativoLegacy).includes(estado)
    ) {
      throw new ClienteDatosInvalidosError(
        'Ese estado ya no se asigna: la deuda se refleja en la cobranza.',
      );
    }

    this.set('estadoCliente', estado);
    this.fijarFechaDeBaja(fecha);
  }

  /**
   * Refleja lo que el router ya confirmó. Devuelve `false` si el cliente ya
   * estaba en ese estado.
   */
  sincronizarEstadoOperativo(
    estado: EstadoOperativoCliente.ACTIVO | EstadoOperativoCliente.SUSPENDIDO,
  ): boolean {
    this.assertEditable();
    if (this.props.estadoCliente === estado) return false;

    this.set('estadoCliente', estado);
    this.set('desinstaladoEn', null);

    return true;
  }

  /**
   * El servicio se retiró. Se admite en un cliente eliminado porque el retiro
   * físico ocurrió de todos modos. Devuelve `false` si ya estaba desinstalado.
   */
  marcarDesinstalado(fecha: Date): boolean {
    const yaEstaba =
      this.props.estadoCliente === EstadoOperativoCliente.DESINSTALADO &&
      this.props.desinstaladoEn !== null;
    if (yaEstaba) return false;

    this.set('estadoCliente', EstadoOperativoCliente.DESINSTALADO);
    this.fijarFechaDeBaja(fecha);

    return true;
  }

  /** Borrado lógico: la fila y todo su historial se conservan. */
  eliminar(params: {
    actorId: number;
    motivo?: string | null;
    comentario?: string | null;
    fecha: Date;
  }): void {
    this.assertEditable();

    this.set('isEliminado', true);
    this.set('eliminadoEn', new Date(params.fecha));
    this.set('eliminadoPorId', params.actorId);
    this.set('motivoEliminacion', params.motivo?.trim() || null);
    this.set('comentarioEliminacion', params.comentario?.trim() || null);
  }

  /** La fecha de baja se fija una sola vez y se limpia al salir de DESINSTALADO. */
  private fijarFechaDeBaja(fecha: Date): void {
    if (this.props.estadoCliente !== EstadoOperativoCliente.DESINSTALADO) {
      this.set('desinstaladoEn', null);
    } else if (this.props.desinstaladoEn === null) {
      this.set('desinstaladoEn', new Date(fecha));
    }
  }

  private assertEditable(): void {
    if (this.props.isEliminado) throw new ClienteEliminadoError();
  }

  private static nombreValido(nombre: string): string {
    const limpio = nombre?.trim();
    if (!limpio) {
      throw new ClienteDatosInvalidosError('El nombre es obligatorio.');
    }
    return limpio;
  }

  private set<K extends keyof ClienteProps>(
    campo: K,
    valor: ClienteProps[K],
  ): void {
    const anterior = this.props[campo];
    const igual =
      anterior instanceof Date && valor instanceof Date
        ? anterior.getTime() === valor.getTime()
        : anterior === valor;

    if (igual) return;

    this.props[campo] = valor;
    this.cambios.add(campo);
  }
}
