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
  Logger,
  InternalServerErrorException,
  HttpException,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { RutaCobroService } from './ruta-cobro.service';
import { UpdateRutaDto } from './dto/update-ruta-cobro.dto';
import { CreateNewRutaDto } from './dto/create-new-ruta.dto';
import { Response } from 'express';
import { queryRutasDto } from './dto/query';

@Controller('ruta-cobro')
export class RutaCobroController {
  private logger = new Logger(RutaCobroController.name);
  constructor(private readonly rutaCobroService: RutaCobroService) {}

  @Post()
  create(@Body() createRutaCobroDto: CreateNewRutaDto) {
    return this.rutaCobroService.create(createRutaCobroDto);
  }

  @Get()
  findAll() {
    return this.rutaCobroService.findAll();
  }

  /**
   *
   * @param rutaId RUTA ID
   * @returns Toda una ruta para su inicio en cobro calle
   */
  @Get('/get-one-ruta-cobro/:rutaId')
  finRutaCobro(@Param('rutaId', ParseIntPipe) rutaId: number) {
    console.log('Visitando la ruta');
    return this.rutaCobroService.finRutaCobro(rutaId);
  }

  @Get('/get-one-ruta-to-edit/:rutaId')
  getOneRutaEdit(@Param('rutaId', ParseIntPipe) rutaId: number) {
    return this.rutaCobroService.getRutaCobroToEdit(rutaId);
  }

  /**
   *
   * @returns todas las rutas de cobro para su vista y administracion
   */
  @Get('/get-rutas-cobros')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
      forbidNonWhitelisted: false,
    }),
  )
  async getRutas(@Query() query: queryRutasDto) {
    this.logger.log(`Dquery:\n${JSON.stringify(query, null, 2)}`);
    return await this.rutaCobroService.findAllRutas(query);
  }

  @Get('rutas-cobros-asignadas')
  async getRutasCobroAsignadasUser(@Query('id', ParseIntPipe) id: number) {
    return await this.rutaCobroService.findRutasAsignadas(id);
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
