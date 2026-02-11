import { PartialType } from '@nestjs/mapped-types';
import { CreateGenerateReportDto } from './create-generate-report.dto';

export class UpdateGenerateReportDto extends PartialType(CreateGenerateReportDto) {}
