import { PartialType } from '@nestjs/mapped-types';
import { CreateMikroTikDto } from './create-mikro-tik.dto';

export class UpdateMikroTikDto extends PartialType(CreateMikroTikDto) {}
