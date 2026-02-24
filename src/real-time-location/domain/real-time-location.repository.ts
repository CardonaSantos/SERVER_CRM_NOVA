import { CreateRealTimeDto } from '../dto/create-real-time.dto';
import { RealTimeLocationMapDto } from '../dto/dto-shape';
import { UpdateRealTimeDto } from '../dto/update-real-time.dto';
import { RealTimeLocation } from '../entities/real-time.entity';

export const REAL_TIME_LOCATION = Symbol('REAL_TIME_LOCATION');

export interface RealTimeLocationRepository {
  updateLocation(dto: CreateRealTimeDto): Promise<RealTimeLocation>;

  // getLastLocations(): Promise<RealTimeLocation[]>;
  getLastLocations(): Promise<RealTimeLocationMapDto[]>;
}
