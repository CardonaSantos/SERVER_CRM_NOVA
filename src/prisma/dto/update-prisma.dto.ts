import { PartialType } from '@nestjs/mapped-types';
import { CreatePrismaDto } from './create-prisma.dto';

export class UpdatePrismaDto extends PartialType(CreatePrismaDto) {}
