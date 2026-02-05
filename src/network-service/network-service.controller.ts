import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { NetworkServiceService } from './network-service.service';
import { CreateNetworkServiceDto } from './dto/create-network-service.dto';
import { UpdateNetworkServiceDto } from './dto/update-network-service.dto';

@Controller('network-service')
export class NetworkServiceController {
  constructor(private readonly networkServiceService: NetworkServiceService) {}
}
