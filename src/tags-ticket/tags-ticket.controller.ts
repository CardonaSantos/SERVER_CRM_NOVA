import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TagsTicketService } from './tags-ticket.service';
import { CreateTagsTicketDto } from './dto/create-tags-ticket.dto';
import { UpdateTagsTicketDto } from './dto/update-tags-ticket.dto';

@Controller('tags-ticket')
export class TagsTicketController {
  constructor(private readonly tagsTicketService: TagsTicketService) {}

  @Post()
  create(@Body() createTagsTicketDto: CreateTagsTicketDto) {
    return this.tagsTicketService.create(createTagsTicketDto);
  }

  @Get()
  findAll() {
    return this.tagsTicketService.findAll();
  }

  @Get('/get-tags-to-ticket')
  getEtiquetasToTicket() {
    return this.tagsTicketService.getEtiquetasToTicket();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagsTicketService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTagsTicketDto: UpdateTagsTicketDto,
  ) {
    return this.tagsTicketService.update(+id, updateTagsTicketDto);
  }

  @Delete('/delete-ticket/:id')
  remove(@Param('id') id: string) {
    return this.tagsTicketService.remove(+id);
  }
}
