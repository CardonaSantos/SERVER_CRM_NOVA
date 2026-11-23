import { PartialType } from '@nestjs/swagger';
import { CreatePrismaDto } from './create-prisma.dto';

export class UpdatePrismaDto extends PartialType(CreatePrismaDto) {}
