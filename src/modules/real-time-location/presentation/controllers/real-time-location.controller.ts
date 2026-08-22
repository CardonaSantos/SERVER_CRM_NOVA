import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RealTimeLocationService } from '../../application/services/real-time-location.service';
import { CreateRealTimeLocationDto } from '../../application/dto/create-real-time-location.dto';
import { UpdateRealTimeLocationDto } from '../../application/dto/update-real-time-location.dto';

@Controller('real-time-location')
export class RealTimeLocationController {
  constructor(
    private readonly realTimeLocationService: RealTimeLocationService,
  ) {}

  @Post()
  create(@Body() createRealTimeLocationDto: CreateRealTimeLocationDto) {
    return this.realTimeLocationService.create(createRealTimeLocationDto);
  }

  @Get()
  findAll() {
    return this.realTimeLocationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.realTimeLocationService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRealTimeLocationDto: UpdateRealTimeLocationDto,
  ) {
    return this.realTimeLocationService.update(+id, updateRealTimeLocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.realTimeLocationService.remove(+id);
  }
}
