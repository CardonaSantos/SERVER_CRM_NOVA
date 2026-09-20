import { Injectable } from '@nestjs/common';
import { CreateExcelReportDto } from '../../dto/create-excel-report.dto';
import { UpdateExcelReportDto } from '../../dto/update-excel-report.dto';

@Injectable()
export class ExcelReportsService {
  create(createExcelReportDto: CreateExcelReportDto) {
    return 'This action adds a new excelReport';
  }

  findAll() {
    return `This action returns all excelReports`;
  }

  findOne(id: number) {
    return `This action returns a #${id} excelReport`;
  }

  update(id: number, updateExcelReportDto: UpdateExcelReportDto) {
    return `This action updates a #${id} excelReport`;
  }

  remove(id: number) {
    return `This action removes a #${id} excelReport`;
  }
}
