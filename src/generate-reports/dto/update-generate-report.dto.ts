import { PartialType } from '@nestjs/swagger';
import { CreateGenerateReportDto } from './create-generate-report.dto';

export class UpdateGenerateReportDto extends PartialType(CreateGenerateReportDto) {}
