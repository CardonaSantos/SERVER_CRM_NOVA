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

@UseGuards(JwtAuthGuard)
@Controller('mikrotik-ssh')
export class MikrotikSshController {}
