import {
  EstadoCobranzaClienteDomain,
  EstadoOperativoCliente,
  EstadoOperativoLegacy,
} from '../enums/cliente-internet.enum';
import {
  ActualizarAsignacionesCliente,
  ActualizarPerfilCliente,
  ClienteInternetProps,
  ConfirmacionOperacionPppoe,
  CrearClienteInternetProps,
} from '../props/cliente-internet.props';

export class ClienteInternetDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClienteInternetDomainError';
  }
}

const fechaCopia = (fecha: Date | null): Date | null =>
  fecha ? new Date(fecha.getTime()) : null;
const texto = (v: string | null | undefined): string | null => {
  if (v == null) return null;
  const s = v.trim();
  return s === '' ? null : s;
};
const nombreValido = (v: string) => {
  const s = v?.trim();
  if (!s) throw new ClienteInternetDomainError('nombre es obligatorio.');
  return s;
};
const idOpcional = (
  v: number | null | undefined,
  campo: string,
): number | null => {
  if (v == null) return null;
  if (!Number.isInteger(v) || v <= 0)
    throw new ClienteInternetDomainError(`${campo} debe ser entero positivo.`);
  return v;
};
const fechaOpcional = (
  v: Date | null | undefined,
  campo: string,
): Date | null => {
  if (v == null) return null;
  if (!(v instanceof Date) || Number.isNaN(v.getTime()))
    throw new ClienteInternetDomainError(`${campo} inválida.`);
  return new Date(v.getTime());
};
const fechaRequerida = (v: Date, campo: string): Date => {
  const fecha = fechaOpcional(v, campo);
  if (!fecha) throw new ClienteInternetDomainError(`${campo} obligatoria.`);
  return fecha;
};

/** Único agregado de escritura del cliente; las colecciones se resuelven con QueryPorts. */
export class ClienteInternetEntity {
  private readonly cambios = new Set<keyof ClienteInternetProps>();
  private constructor(private readonly props: ClienteInternetProps) {}

  static create(
    input: CrearClienteInternetProps,
    ahora: Date = new Date(),
  ): ClienteInternetEntity {
    const fecha = fechaRequerida(ahora, 'ahora');
    const estadosAltas = [
      EstadoOperativoCliente.ACTIVO,
      EstadoOperativoCliente.PENDIENTE_ACTIVO,
      EstadoOperativoCliente.EN_INSTALACION,
    ];
    if (!estadosAltas.includes(input.estadoInicial)) {
      throw new ClienteInternetDomainError(
        'Estado inicial no permitido para una nueva alta.',
      );
    }
    const props: ClienteInternetProps = {
      id: null,
      empresaId: idOpcional(input.empresaId, 'empresaId'),
      asesorId: idOpcional(input.asesorId, 'asesorId'),
      nombre: nombreValido(input.nombre),
      apellidos: texto(input.apellidos),
      dpi: texto(input.dpi),
      observaciones: texto(input.observaciones),
      nota: texto(input.nota),
      telefono: texto(input.telefono),
      direccion: texto(input.direccion),
      contactoReferenciaNombre: texto(input.contactoReferenciaNombre),
      contactoReferenciaTelefono: texto(input.contactoReferenciaTelefono),
      contrasenaWifi: input.contrasenaWifi ?? null,
      ssidRouter: texto(input.ssidRouter),
      fechaInstalacion: fechaOpcional(
        input.fechaInstalacion,
        'fechaInstalacion',
      ),
      servicioInternetId: idOpcional(
        input.servicioInternetId,
        'servicioInternetId',
      ),
      sectorId: idOpcional(input.sectorId, 'sectorId'),
      enviarRecordatorio: input.enviarRecordatorio ?? true,
      isEliminado: false,
      eliminadoEn: null,
      estadoCliente: input.estadoInicial,
      estadoCobranza: EstadoCobranzaClienteDomain.AL_DIA,
      municipioId: idOpcional(input.municipioId, 'municipioId'),
      departamentoId: idOpcional(input.departamentoId, 'departamentoId'),
      facturacionZonaId: idOpcional(
        input.facturacionZonaId,
        'facturacionZonaId',
      ),
      mikrotikRouterId: null,
      // estadoServicioMikrotik: EstadoServicioMikrotikDomain.SIN_MIKROTIK,
      searchNombre: null,
      creadoEn: fecha,
      actualizadoEn: fecha,
      desinstaladoEn: null,
      eliminadoPorId: null,
      motivoEliminacion: null,
      comentarioEliminacion: null,
      restauradoEn: null,
      restauradoPorId: null,
      whatsappActivo: input.whatsappActivo ?? true,
      whatsappDesactivadoEn: null,
      whatsappDesactivadoPorId: null,
      motivoWhatsappDesactivado: null,
    };
    return new ClienteInternetEntity(props);
  }

  /** Rehidratación conservadora: NO recalcula estados ni limpia datos históricos. */
  static hydrate(input: ClienteInternetProps): ClienteInternetEntity {
    idOpcional(input.id, 'id');
    if (input.id == null)
      throw new ClienteInternetDomainError(
        'La hidratación exige id persistido.',
      );
    nombreValido(input.nombre);
    fechaRequerida(input.creadoEn, 'creadoEn');
    fechaRequerida(input.actualizadoEn, 'actualizadoEn');
    const estados = [
      ...Object.values(EstadoOperativoCliente),
      ...Object.values(EstadoOperativoLegacy),
    ];
    if (!estados.includes(input.estadoCliente))
      throw new ClienteInternetDomainError('Estado operativo desconocido.');
    if (
      !Object.values(EstadoCobranzaClienteDomain).includes(input.estadoCobranza)
    )
      throw new ClienteInternetDomainError('Estado de cobranza desconocido.');
    // if (!Object.values(EstadoServicioMikrotikDomain).includes(input.estadoServicioMikrotik)) throw new ClienteInternetDomainError('Estado de MikroTik desconocido.');
    // La BD puede contener filas antiguas: no imponer reglas nuevas entre estados y fechas en hydrate.
    return new ClienteInternetEntity({
      ...input,
      creadoEn: new Date(input.creadoEn),
      actualizadoEn: new Date(input.actualizadoEn),
      fechaInstalacion: fechaCopia(input.fechaInstalacion),
      eliminadoEn: fechaCopia(input.eliminadoEn),
      desinstaladoEn: fechaCopia(input.desinstaladoEn),
      restauradoEn: fechaCopia(input.restauradoEn),
      whatsappDesactivadoEn: fechaCopia(input.whatsappDesactivadoEn),
    });
  }

  get id() {
    return this.props.id;
  }
  get estadoCliente() {
    return this.props.estadoCliente;
  }
  get estadoCobranza() {
    return this.props.estadoCobranza;
  }
  get isEliminado() {
    return this.props.isEliminado;
  }
  get estaActivo() {
    return (
      !this.props.isEliminado &&
      this.props.estadoCliente === EstadoOperativoCliente.ACTIVO
    );
  }
  /** Regla operativa actual del cron de facturación: una suspensión detiene nuevas facturas. */
  get esFacturableAutomaticamente() {
    return this.estaActivo && this.props.desinstaladoEn === null;
  }
  /** Condición operativa solamente: el evaluador de cortes aún debe comprobar facturas y acceso PPPoE. */
  get puedeEvaluarseParaCorte() {
    return this.esFacturableAutomaticamente;
  }
  get estaSuspendido() {
    return this.props.estadoCliente === EstadoOperativoCliente.SUSPENDIDO;
  }
  get estaDesinstalado() {
    return (
      this.props.estadoCliente === EstadoOperativoCliente.DESINSTALADO ||
      this.props.desinstaladoEn !== null
    );
  }
  get esEstadoLegacy() {
    return Object.values(EstadoOperativoLegacy).includes(
      this.props.estadoCliente as EstadoOperativoLegacy,
    );
  }
  get actualizadoEn() {
    return new Date(this.props.actualizadoEn);
  }
  get tieneCambios() {
    return this.cambios.size > 0;
  }

  /** Apto para mappers internos; no exponer directamente por HTTP: incluye contraseña Wi-Fi. */
  toPrimitives(): ClienteInternetProps {
    const p = this.props;
    return {
      ...p,
      creadoEn: new Date(p.creadoEn),
      actualizadoEn: new Date(p.actualizadoEn),
      fechaInstalacion: fechaCopia(p.fechaInstalacion),
      eliminadoEn: fechaCopia(p.eliminadoEn),
      desinstaladoEn: fechaCopia(p.desinstaladoEn),
      restauradoEn: fechaCopia(p.restauradoEn),
      whatsappDesactivadoEn: fechaCopia(p.whatsappDesactivadoEn),
    };
  }

  /** Patch de cambios reales: evita sobrescribir campos no editados o cambios concurrentes. */
  getChangedPrimitives(): Partial<ClienteInternetProps> {
    const p = this.toPrimitives();
    const delta: Partial<ClienteInternetProps> = {};
    for (const campo of this.cambios)
      (delta as Record<string, unknown>)[campo] = p[campo];
    return delta;
  }

  actualizarPerfil(input: ActualizarPerfilCliente): void {
    this.assertEditable();
    if (input.nombre !== undefined)
      this.set('nombre', nombreValido(input.nombre));
    const camposTexto = [
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
    for (const campo of camposTexto) {
      if (input[campo] !== undefined) this.set(campo, texto(input[campo]));
    }
    // Conservar el valor recibido (incluyendo cadena vacía) en el secreto Wi-Fi; no registrarlo en logs.
    if (input.contrasenaWifi !== undefined)
      this.set('contrasenaWifi', input.contrasenaWifi);
    if (input.fechaInstalacion !== undefined)
      this.set(
        'fechaInstalacion',
        fechaOpcional(input.fechaInstalacion, 'fechaInstalacion'),
      );
    if (input.enviarRecordatorio !== undefined) {
      if (typeof input.enviarRecordatorio !== 'boolean')
        throw new ClienteInternetDomainError(
          'enviarRecordatorio debe ser boolean.',
        );
      this.set('enviarRecordatorio', input.enviarRecordatorio);
    }
  }

  actualizarAsignaciones(input: ActualizarAsignacionesCliente): void {
    this.assertEditable();
    const campos = [
      'asesorId',
      'servicioInternetId',
      'sectorId',
      'municipioId',
      'departamentoId',
      'facturacionZonaId',
    ] as const;
    for (const campo of campos)
      if (input[campo] !== undefined)
        this.set(campo, idOpcional(input[campo], campo));
    // El caso de uso debe validar existencia de FKs y reglas del plan/PPPoE antes de persistir.
  }

  /** Guardar el estado operativo solo después de una confirmación remota real.
   * IMPORTANTE: el adaptador PPPoE ya existente es responsable de persistir el cambio + historial.
   */
  confirmarSuspensionPppoe(confirmacion: ConfirmacionOperacionPppoe): boolean {
    this.assertConfirmacion(confirmacion);
    if (this.estaSuspendido) return false;
    this.assertOperable();
    if (!this.estaActivo)
      throw new ClienteInternetDomainError(
        'Solo se suspende un cliente operativo ACTIVO.',
      );
    this.set('estadoCliente', EstadoOperativoCliente.SUSPENDIDO);
    return true;
  }

  confirmarReactivacionPppoe(
    confirmacion: ConfirmacionOperacionPppoe,
  ): boolean {
    this.assertConfirmacion(confirmacion);
    if (this.estaActivo) return false;
    this.assertOperable();
    if (!this.estaSuspendido)
      throw new ClienteInternetDomainError(
        'Solo se reactiva un cliente operativo SUSPENDIDO.',
      );
    this.set('estadoCliente', EstadoOperativoCliente.ACTIVO);
    return true;
  }

  /** No confundir con corte PPPoE. Debe llamarse desde desinstalación autorizada. */
  confirmarDesinstalacion(fecha: Date): void {
    this.assertOperable();
    this.set('estadoCliente', EstadoOperativoCliente.DESINSTALADO);
    this.set('desinstaladoEn', fechaRequerida(fecha, 'fecha'));
  }

  /** Borrado lógico únicamente después de validaciones de dependencias y permisos en el caso de uso. */
  marcarEliminado(params: {
    actorId: number;
    motivo: string;
    comentario?: string | null;
    fecha: Date;
  }): void {
    if (this.props.isEliminado)
      throw new ClienteInternetDomainError('El cliente ya está eliminado.');
    const motivo = nombreValido(params.motivo);
    const id = idOpcional(params.actorId, 'actorId');
    const fecha = fechaRequerida(params.fecha, 'fecha');
    this.set('isEliminado', true);
    this.set('eliminadoEn', fecha);
    this.set('eliminadoPorId', id);
    this.set('motivoEliminacion', motivo);
    this.set('comentarioEliminacion', texto(params.comentario));
  }

  restaurar(params: { actorId: number; fecha: Date }): void {
    if (!this.props.isEliminado)
      throw new ClienteInternetDomainError('El cliente no está eliminado.');
    const id = idOpcional(params.actorId, 'actorId');
    const fecha = fechaRequerida(params.fecha, 'fecha');
    this.set('isEliminado', false);
    this.set('restauradoPorId', id);
    this.set('restauradoEn', fecha);
    // Conservar el historial de eliminación previo, incluso al restaurar.
  }

  desactivarWhatsapp(params: {
    actorId: number;
    motivo: string;
    fecha: Date;
  }): void {
    this.assertEditable();
    this.set('whatsappActivo', false);
    this.set('whatsappDesactivadoEn', fechaRequerida(params.fecha, 'fecha'));
    this.set('whatsappDesactivadoPorId', idOpcional(params.actorId, 'actorId'));
    this.set('motivoWhatsappDesactivado', nombreValido(params.motivo));
  }

  activarWhatsapp(): void {
    this.assertEditable();
    this.set('whatsappActivo', true);
    this.set('whatsappDesactivadoEn', null);
    this.set('whatsappDesactivadoPorId', null);
    this.set('motivoWhatsappDesactivado', null);
  }

  private assertEditable(): void {
    if (this.props.isEliminado)
      throw new ClienteInternetDomainError(
        'No se puede editar un cliente eliminado.',
      );
  }
  private assertOperable(): void {
    this.assertEditable();
    if (this.estaDesinstalado)
      throw new ClienteInternetDomainError('El cliente está desinstalado.');
  }
  private assertConfirmacion(c: ConfirmacionOperacionPppoe): void {
    if (idOpcional(c?.operacionPppoeId, 'operacionPppoeId') === null)
      throw new ClienteInternetDomainError('operacionPppoeId obligatorio.');
    if (idOpcional(c?.cuentaPppoeId, 'cuentaPppoeId') === null)
      throw new ClienteInternetDomainError('cuentaPppoeId obligatorio.');
    fechaRequerida(c?.confirmadoEn, 'confirmadoEn');
    // La entidad no puede verificar el SSH: el caso de uso debe aportar una operación CONFIRMADA.
  }
  private set<K extends keyof ClienteInternetProps>(
    campo: K,
    valor: ClienteInternetProps[K],
  ): void {
    const anterior = this.props[campo];
    const iguales =
      anterior instanceof Date && valor instanceof Date
        ? anterior.getTime() === valor.getTime()
        : anterior === valor;
    if (!iguales) {
      this.props[campo] = valor;
      this.cambios.add(campo);
    }
  }
}
