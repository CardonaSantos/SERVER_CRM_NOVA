import { Injectable } from '@nestjs/common';
import { IP } from '../entities/customer-network-config.entity';

export const IPSymbol = Symbol('IP');

export interface IpRepository {
  create(dto: IP): Promise<IP>;

  update(dto: Partial<IP>): Promise<IP>;

  delete(id: number): Promise<IP | null>;
}
