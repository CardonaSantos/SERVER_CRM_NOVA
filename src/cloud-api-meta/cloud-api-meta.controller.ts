import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CloudApiMetaService } from './cloud-api-meta.service';
import { CreateCloudApiMetaDto } from './dto/create-cloud-api-meta.dto';
import { UpdateCloudApiMetaDto } from './dto/update-cloud-api-meta.dto';

@Controller('cloud-api-meta')
export class CloudApiMetaController {
  constructor(private readonly cloudApiMetaService: CloudApiMetaService) {}
}
