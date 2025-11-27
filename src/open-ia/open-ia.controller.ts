import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OpenIaService } from './open-ia.service';
import { CreateOpenIaDto } from './dto/create-open-ia.dto';
import { UpdateOpenIaDto } from './dto/update-open-ia.dto';

@Controller('open-ia')
export class OpenIaController {
  constructor(private readonly openIaService: OpenIaService) {}
}
