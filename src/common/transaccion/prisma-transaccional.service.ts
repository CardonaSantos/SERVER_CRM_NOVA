import { AsyncLocalStorage } from 'node:async_hooks';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  OpcionesUnidadDeTrabajo,
  UnidadDeTrabajoPort,
} from './unidad-de-trabajo.port';

const transaccionActiva = new AsyncLocalStorage<Prisma.TransactionClient>();

/**
 * Implementa la unidad de trabajo con `$transaction` interactiva y deja la
 * transacción en un AsyncLocalStorage. Los repositorios Prisma leen `cliente`
 * en lugar de `PrismaService`: dentro de una unidad usan la transacción y,
 * fuera, el cliente normal.
 */
@Injectable()
export class PrismaTransaccional implements UnidadDeTrabajoPort {
  constructor(private readonly prisma: PrismaService) {}

  get cliente(): Prisma.TransactionClient {
    return transaccionActiva.getStore() ?? this.prisma;
  }

  get enTransaccion(): boolean {
    return transaccionActiva.getStore() !== undefined;
  }

  /**
   * TRANSITORIO. Une `trabajo` a una transacción que abrió código legacy con
   * `prisma.$transaction`, para que las fachadas de los módulos nuevos
   * escriban dentro de ella. Se retira cuando ese código use `ejecutar`.
   */
  unirseA<T>(
    tx: Prisma.TransactionClient,
    trabajo: () => Promise<T>,
  ): Promise<T> {
    return transaccionActiva.run(tx, trabajo);
  }

  ejecutar<T>(
    trabajo: () => Promise<T>,
    opciones: OpcionesUnidadDeTrabajo = {},
  ): Promise<T> {
    if (this.enTransaccion) return trabajo();

    return this.prisma.$transaction(
      (tx) => transaccionActiva.run(tx, trabajo),
      opciones.aislamiento === 'SERIALIZABLE'
        ? { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        : undefined,
    );
  }
}
