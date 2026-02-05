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
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { ContratoService } from '../app/contrato.service';
import { CreateContratoDto } from '../dto/create-contrato.dto';
import { UpdateContratoDto } from '../dto/update-contrato.dto';

@Controller('contrato')
export class ContratoController {
  private readonly logger = new Logger(ContratoService.name);

  constructor(private readonly contratoService: ContratoService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async create(@Body() dto: CreateContratoDto) {
    this.logger.log(`DTO recibido:\n${JSON.stringify(dto, null, 2)}`);
    return await this.contratoService.create(dto);
  }

  @Post(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async findById(@Param('id', ParseIntPipe) id: number) {
    return await this.contratoService.findById(id);
  }

  @Delete('delete/all')
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async deleteAll() {
    return await this.contratoService.deleteAll();
  }

  @Delete('delete/:id')
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async deleteById(@Param('id', ParseIntPipe) id: number) {
    return await this.contratoService.deleteById(id);
  }

  @Get('')
  async findMany() {
    return await this.contratoService.findMany();
  }
}
