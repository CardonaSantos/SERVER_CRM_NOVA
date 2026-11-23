import { IsString, MaxLength } from 'class-validator';

export class RefreshDto {
  /** Refresh token opaco recibido en el login o en el último refresh. */
  @IsString()
  @MaxLength(256)
  refresh_token: string;
}
