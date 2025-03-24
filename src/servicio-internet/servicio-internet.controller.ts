import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ServicioInternetService } from './servicio-internet.service';
import { CreateServicioInternetDto } from './dto/create-servicio-internet.dto';
import { UpdateServicioInternetDto } from './dto/update-servicio-internet.dto';

@Controller('servicio-internet')
export class ServicioInternetController {
  constructor(
    private readonly servicioInternetService: ServicioInternetService,
  ) {}

  @Post()
  create(@Body() createServicioInternetDto: CreateServicioInternetDto) {
    return this.servicioInternetService.create(createServicioInternetDto);
  }

  @Get()
  findAll() {
    return this.servicioInternetService.findAll();
  }

  @Get('/get-services-to-customer')
  findAllServicesToCreateCustomer() {
    return this.servicioInternetService.findAllServicesToCreateCustomer();
  }

  @Get('/get-servicios-internet')
  getServiciosInternet() {
    return this.servicioInternetService.getServiciosInternet();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicioInternetService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateServicioInternetDto: UpdateServicioInternetDto,
  ) {
    return this.servicioInternetService.update(+id, updateServicioInternetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicioInternetService.remove(+id);
  }
}
