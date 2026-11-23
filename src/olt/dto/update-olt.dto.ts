import { PartialType } from '@nestjs/swagger';
import { CreateOltDto } from './create-olt.dto';

export class UpdateOltDto extends PartialType(CreateOltDto) {}
