import { PartialType } from '@nestjs/swagger';
import { CreateExcelReportDto } from './create-excel-report.dto';

export class UpdateExcelReportDto extends PartialType(CreateExcelReportDto) {}
