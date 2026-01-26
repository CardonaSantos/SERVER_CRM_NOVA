import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Query,
  Logger,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { CreditoService } from '../app/credito.service';
import { CrearCreditoDto } from '../dto/create-credito.dto';
import { GetCreditosQueryDto } from '../dto/get-creditos-query.dto';

@Controller('credito')
export class CreditoController {
  private readonly logger = new Logger(CreditoController.name);
  constructor(private readonly creditoService: CreditoService) {}

  /**
   * CREACION DE UN REGISTRO DE CREDITO POST
   * @param dto
   * @returns
   */
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

  /**
   * Busqueda de registros con query
   * @param query
   * @returns
   */
  @Get('find-many')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async getAllCreditos(@Query() query: GetCreditosQueryDto) {
    return await this.creditoService.finMany(query);
  }

  /**
   * Busqueda de un solo registro
   * @param id
   * @returns
   */
  @Get(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async getCredito(@Param('id', ParseIntPipe) id: number) {
    return await this.creditoService.getCredito(id);
  }

  /**
   * ELIMINACION DE TODO
   * @returns
   */
  @Delete('delete-all')
  async deleteAll() {
    return await this.creditoService.deleteAll();
  }
}
