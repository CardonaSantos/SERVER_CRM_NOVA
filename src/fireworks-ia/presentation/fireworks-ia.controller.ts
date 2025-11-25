import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FireworksIaService } from '../application/fireworks-ia.service';
import { CreateFireworksIaDto } from '../dto/create-fireworks-ia.dto';
import { UpdateFireworksIaDto } from '../dto/update-fireworks-ia.dto';

@Controller('fireworks-ia')
export class FireworksIaController {
  constructor(private readonly fireworksIaService: FireworksIaService) {}
}
