import Decimal from 'decimal.js';
import {
  EstadoCredito,
  FrecuenciaPago,
  InteresTipo,
  OrigenCredito,
} from '@prisma/client';
import { CuotaCredito } from '../credito-cuotas/entities/credito-cuota.entity';
export interface CreditoRelations {
  cuotas?: CuotaCredito[];
  // Si tienes entidad de Pago, agrégala aquí. Si no, usa any temporalmente o crea la entidad
  pagos?: any[];
  clienteNombre?: string;
  usuarioNombre?: string;
}

export class Credito {
  // Estado interno (privado)
  private estado: EstadoCredito;
  private montoTotal: Decimal;
  private montoCuota: Decimal;
  // NUEVAS PROPIEDADES OPCIONALES
  private cuotas?: CuotaCredito[];
  private pagos?: any[];
  private clienteNombre?: string;
  private usuarioNombre?: string;
  // Constructor (privado)
  private constructor(
    private readonly id: number | null,
    private readonly clienteId: number,

    private readonly montoCapital: Decimal,
    private readonly interesPorcentaje: Decimal,

    private readonly interesMoraPorcentaje: Decimal,

    private readonly engancheMonto: Decimal,

    private readonly interesTipo: InteresTipo,

    private readonly plazoCuotas: number,
    private readonly frecuencia: FrecuenciaPago,
    private readonly intervaloDias: number,

    estado: EstadoCredito,
    private readonly fechaInicio: Date,
    private readonly fechaFinEstimada: Date,

    private readonly origenCredito: OrigenCredito,
    private readonly observaciones?: string,
    private readonly creadoPorId?: number,
  ) {
    this.estado = estado;
    this.montoTotal = new Decimal(0);
    this.montoCuota = new Decimal(0);
  }

  // Factory Method
  static crear(params: {
    clienteId: number;
    montoCapital: Decimal;
    interesPorcentaje: Decimal;
    interesMoraPorcentaje: Decimal;
    engancheMonto: Decimal;
    interesTipo: InteresTipo;
    plazoCuotas: number;
    frecuencia: FrecuenciaPago;
    intervaloDias: number;
    fechaInicio: Date;
    origenCredito: OrigenCredito;
    observaciones?: string;
    creadoPorId?: number;
  }): Credito {
    // Invariantes básicas
    if (params.montoCapital.lte(0)) {
      throw new Error('El monto del crédito debe ser mayor a 0');
    }

    if (params.plazoCuotas <= 0) {
      throw new Error('El plazo de cuotas debe ser mayor a 0');
    }

    if (params.intervaloDias <= 0) {
      throw new Error('El intervalo de días debe ser mayor a 0');
    }

    if (params.interesPorcentaje.lt(0)) {
      throw new Error('El interés no puede ser negativo');
    }

    const fechaFinEstimada = new Date(
      params.fechaInicio.getTime() +
        params.intervaloDias * params.plazoCuotas * 24 * 60 * 60 * 1000,
    );

    const credito = new Credito(
      null,
      params.clienteId,
      params.montoCapital,
      params.interesPorcentaje,
      params.interesMoraPorcentaje,
      params.engancheMonto,
      params.interesTipo,
      params.plazoCuotas,
      params.frecuencia,
      params.intervaloDias,
      EstadoCredito.ACTIVO,
      params.fechaInicio,
      fechaFinEstimada,
      params.origenCredito,
      params.observaciones,
      params.creadoPorId,
    );

    credito.calcularMontosPendiente();

    return credito;
  }

  static rehidratar(props: {
    id: number;
    clienteId: number;
    montoCapital: Decimal;
    interesPorcentaje: Decimal;
    interesMoraPorcentaje: Decimal;
    engancheMonto: Decimal;
    interesTipo: InteresTipo;
    plazoCuotas: number;
    frecuencia: FrecuenciaPago;
    intervaloDias: number;
    montoTotal: Decimal;
    montoCuota: Decimal;
    estado: EstadoCredito;
    fechaInicio: Date;
    fechaFinEstimada: Date;

    origenCredito: OrigenCredito;
    observaciones?: string;
    creadoPorId?: number;

    relations?: CreditoRelations;
  }): Credito {
    const credito = new Credito(
      props.id,
      props.clienteId,
      props.montoCapital,
      props.interesPorcentaje,
      props.interesMoraPorcentaje,
      props.engancheMonto,
      props.interesTipo,
      props.plazoCuotas,
      props.frecuencia,
      props.intervaloDias,
      props.estado,
      props.fechaInicio,
      props.fechaFinEstimada,
      props.origenCredito,
      props.observaciones,
      props.creadoPorId,
    );

    // seteo directo del estado persistido
    credito.montoTotal = props.montoTotal;
    credito.montoCuota = props.montoCuota;

    // Asignar relaciones si existen
    if (props.relations) {
      credito.cuotas = props.relations.cuotas;
      credito.pagos = props.relations.pagos;
      credito.clienteNombre = props.relations.clienteNombre;
      credito.usuarioNombre = props.relations.usuarioNombre;
    }

    return credito;
  }

  // GETTERS PARA LAS RELACIONES
  public getCuotas(): CuotaCredito[] | undefined {
    return this.cuotas;
  }

  public getClienteNombre(): string | undefined {
    return this.clienteNombre;
  }

  // getters usados por el mapper
  getId() {
    return this.id;
  }

  getInteresPorcentaje() {
    return this.interesPorcentaje;
  }

  getInteresMoraPorcentaje() {
    return this.interesMoraPorcentaje;
  }

  getEngancheMonto() {
    return this.engancheMonto;
  }

  getInteresTipo() {
    return this.interesTipo;
  }

  getFrecuencia() {
    return this.frecuencia;
  }

  getIntervaloDias() {
    return this.intervaloDias;
  }

  getOrigenCredito() {
    return this.origenCredito;
  }

  getObservaciones() {
    return this.observaciones;
  }

  // Comportamiento de dominio

  public aplicarPago(monto: Decimal): void {
    if (this.estado === EstadoCredito.CANCELADO) {
      throw new Error('No se puede pagar un crédito cancelado');
    }

    if (this.estado === EstadoCredito.COMPLETADO) {
      throw new Error('El crédito ya está completamente pagado');
    }

    if (monto.lte(0)) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    // Aquí NO se modifica montoTotal directamente.
    // El pago real se aplica a cuotas (otra entidad).
  }

  public cancelar(): void {
    if (this.estado === EstadoCredito.COMPLETADO) {
      throw new Error('No se puede cancelar un crédito completado');
    }

    this.estado = EstadoCredito.CANCELADO;
  }

  public marcarEnMora(): void {
    if (this.estado === EstadoCredito.CANCELADO) {
      return;
    }

    if (this.estado === EstadoCredito.COMPLETADO) {
      return;
    }

    this.estado = EstadoCredito.EN_MORA;
  }

  public marcarComoCompletado(): void {
    if (this.estado === EstadoCredito.CANCELADO) {
      throw new Error('Un crédito cancelado no puede completarse');
    }

    this.estado = EstadoCredito.COMPLETADO;
  }

  // Métodos de consulta (read)
  public getEstado(): EstadoCredito {
    return this.estado;
  }

  public getMontoCapital(): Decimal {
    return this.montoCapital;
  }

  public getMontoTotal(): Decimal {
    return this.montoTotal;
  }

  public getMontoCuota(): Decimal {
    return this.montoCuota;
  }

  public getPlazoCuotas(): number {
    return this.plazoCuotas;
  }

  public getFechaInicio(): Date {
    return this.fechaInicio;
  }

  public getFechaFinEstimada(): Date {
    return this.fechaFinEstimada;
  }

  public getClienteId(): number {
    return this.clienteId;
  }

  public getCreadoPorId(): number | undefined {
    return this.creadoPorId;
  }

  // Pendiente (intencional)
  // private calcularMontosPendiente(): void {
  //   /**
  //    * TODO:
  //    * - Generar cuotas
  //    * - Calcular montoCapital por cuota
  //    * - Calcular interés por cuota
  //    * - Definir montoTotal del crédito
  //    * - Definir montoCuota
  //    *
  //    * Este método DEBE dejar el agregado
  //    * en estado consistente.
  //    */
  // }

  private calcularMontosPendiente(): void {
    const enganche = this.engancheMonto ?? new Decimal(0);

    const capitalFinanciado = this.montoCapital.minus(enganche);

    const interes = capitalFinanciado.mul(this.interesPorcentaje).div(100);

    this.montoTotal = capitalFinanciado.plus(interes);
    this.montoCuota = this.montoTotal.div(this.plazoCuotas);
  }
}
