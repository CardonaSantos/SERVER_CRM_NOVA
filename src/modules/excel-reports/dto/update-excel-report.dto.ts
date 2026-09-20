import { PartialType } from '@nestjs/mapped-types';
import { CreateExcelReportDto } from './create-excel-report.dto';

export class UpdateExcelReportDto extends PartialType(CreateExcelReportDto) {}
