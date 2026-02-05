import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { PlantillaLegalService } from '../app/plantilla-legal.service';
import { CreatePlantillaLegalDto } from '../dto/create-plantilla-legal.dto';
import { UpdatePlantillaLegalDto } from '../dto/update-plantilla-legal.dto';
import { TipoPlantillaLegal } from '@prisma/client';

@Controller('plantillas-legales')
export class PlantillaLegalController {
  constructor(private readonly service: PlantillaLegalService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  create(@Body() dto: CreatePlantillaLegalDto) {
    return this.service.create(dto);
  }

  @Get()
  findMany(
    @Query('tipo') tipo?: TipoPlantillaLegal,
    @Query('soloActivas') soloActivas?: boolean,
  ) {
    return this.service.findMany({
      tipo,
      soloActivas,
    });
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  // creditoId: number, plantillaId: number

  @Get(':creditoId/:plantillaId')
  getHTML(
    @Param('creditoId', ParseIntPipe) creditoId: number,
    @Param('plantillaId', ParseIntPipe) plantillaId: number,
  ) {
    return this.service.getHTML(creditoId, plantillaId);
  }

  @Patch(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlantillaLegalDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/activar')
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.service.activar(id);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.service.desactivar(id);
  }
}
