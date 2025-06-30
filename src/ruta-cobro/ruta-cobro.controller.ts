import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { RutaCobroService } from './ruta-cobro.service';
import { CreateRutaDto } from './dto/create-ruta-cobro.dto';
import { UpdateRutaDto } from './dto/update-ruta-cobro.dto';
import { CreateNewRutaDto } from './dto/create-new-ruta.dto';
import { Response } from 'express';

@Controller('ruta-cobro')
export class RutaCobroController {
  constructor(private readonly rutaCobroService: RutaCobroService) {}

  @Post()
  create(@Body() createRutaCobroDto: CreateNewRutaDto) {
    return this.rutaCobroService.create(createRutaCobroDto);
  }

  @Get()
  findAll() {
    return this.rutaCobroService.findAll();
  }

  @Get('/get-one-ruta-cobro/:rutaId')
  finRutaCobro(@Param('rutaId', ParseIntPipe) rutaId: number) {
    console.log('Visitando la ruta');
    return this.rutaCobroService.finRutaCobro(rutaId);
  }

  @Get('/get-one-ruta-to-edit/:rutaId')
  getOneRutaEdit(@Param('rutaId', ParseIntPipe) rutaId: number) {
    return this.rutaCobroService.getRutaCobroToEdit(rutaId);
  }

  @Get('/get-rutas-cobros')
  findAllRutas() {
    return this.rutaCobroService.findAllRutas();
  }

  @Get('/get-excel-ruta/:id')
  async downloadExcelRutaCobro(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const buffer = await this.rutaCobroService.downloadExcelRutaCobro(id);

    //Response de express
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    //Nombre de archivo explicito con terminacion de tipo de archivo y buffer
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="clientes_ruta_${id}.xlsx"`,
    );

    res.end(buffer);
  }

  @Patch('/update-one-ruta/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRutaCobroDto: UpdateRutaDto,
  ) {
    return this.rutaCobroService.updateOneRutaCobro(id, updateRutaCobroDto);
  }

  @Patch('/close-one-ruta/:id')
  closeRuta(
    @Param('id', ParseIntPipe) id: number,
    // @Body() updateRutaCobroDto: UpdateRutaDto,
  ) {
    console.log('controlador de ruta');

    return this.rutaCobroService.closeRuta(id);
  }

  @Delete('/delete-all')
  removeAll() {
    return this.rutaCobroService.removeAll();
  }

  @Delete('/delete-one-ruta/:id')
  removeOneRuta(@Param('id', ParseIntPipe) id: number) {
    return this.rutaCobroService.removeOneRuta(id);
  }
}
