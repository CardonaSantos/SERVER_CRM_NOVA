import { PartialType } from '@nestjs/mapped-types';
import { CreateOltDto } from './create-olt.dto';

export class UpdateOltDto extends PartialType(CreateOltDto) {}
