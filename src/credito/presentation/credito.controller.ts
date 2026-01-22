import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Query,
  Logger,
} from '@nestjs/common';
import { CreditoService } from '../app/credito.service';
import { CrearCreditoDto } from '../dto/create-credito.dto';
import { GetCreditosQueryDto } from '../dto/get-creditos-query.dto';

@Controller('credito')
export class CreditoController {
  private readonly logger = new Logger(CreditoController.name);
  constructor(private readonly creditoService: CreditoService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  create(@Body() dto: CrearCreditoDto) {
    this.logger.log(`DTO recibido:\n${JSON.stringify(dto, null, 2)}`);
    return this.creditoService.create(dto);
  }

  @Get('find-many')
  async getAllCreditos(@Query() query: GetCreditosQueryDto) {
    return await this.creditoService.finMany(query);
  }
}
