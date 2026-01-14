import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { CreditoService } from '../app/credito.service';
import { CrearCreditoDto } from '../dto/create-credito.dto';
import { UpdateCreditoDto } from '../dto/update-credito.dto';
import { GetCreditosQueryDto } from '../dto/query';

@Controller('credito')
export class CreditoController {
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
    return this.creditoService.create(dto);
  }

  @Get('find-many')
  async getAllCreditos() {
    return await this.creditoService.finMany();
  }

  @Get('cliente')
  async getCreditoCliente(@Query() query: GetCreditosQueryDto) {
    return this.creditoService.getClienteCredito(query);
  }
}
