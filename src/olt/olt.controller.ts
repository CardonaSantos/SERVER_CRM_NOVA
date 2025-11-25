import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OltService } from './olt.service';
import { CreateOltDto } from './dto/create-olt.dto';
import { UpdateOltDto } from './dto/update-olt.dto';

@Controller('olt')
export class OltController {
  constructor(private readonly oltService: OltService) {}

  @Post()
  create(@Body() createOltDto: CreateOltDto) {
    return this.oltService.create(createOltDto);
  }

  @Get()
  findAll() {
    return this.oltService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.oltService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOltDto: UpdateOltDto) {
    return this.oltService.update(+id, updateOltDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.oltService.remove(+id);
  }
}
