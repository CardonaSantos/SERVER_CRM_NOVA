import {
  IsBooleanString,
  IsISO8601,
  IsOptional,
  IsString,
} from 'class-validator';

export class ClientesInternetReportRequest {
  @IsOptional() @IsISO8601() desde?: string;
  @IsOptional() @IsISO8601() hasta?: string;
  @IsOptional() @IsString() sectorId?: number;
  @IsOptional() @IsString() planId?: number;
  @IsOptional() @IsBooleanString() activos?: string; // 'true' | 'false'
}
