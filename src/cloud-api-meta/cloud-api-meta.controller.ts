import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';
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

@UseGuards(JwtAuthGuard)
@Controller('cloud-api-meta')
export class CloudApiMetaController {
  constructor(private readonly cloudApiMetaService: CloudApiMetaService) {}
}
