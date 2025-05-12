import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MikroTikService } from './mikro-tik.service';
import { CreateMikroTikDto } from './dto/create-mikro-tik.dto';
import { UpdateMikroTikDto } from './dto/update-mikro-tik.dto';

@Controller('mikro-tik')
export class MikroTikController {
  constructor(private readonly mikroTikService: MikroTikService) {}

  @Post()
  create(@Body() createMikroTikDto: CreateMikroTikDto) {
    return this.mikroTikService.create(createMikroTikDto);
  }

  @Get()
  findAll() {
    return this.mikroTikService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mikroTikService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMikroTikDto: UpdateMikroTikDto) {
    return this.mikroTikService.update(+id, updateMikroTikDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mikroTikService.remove(+id);
  }
}
