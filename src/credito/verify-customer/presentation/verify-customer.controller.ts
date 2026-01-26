import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { VerifyCustomerService } from '../app/verify-customer.service';
import { CreateVerifyCustomerDto } from '../dto/create-verify-customer.dto';
import { UpdateVerifyCustomerDto } from '../dto/update-verify-customer.dto';
import { verifyClientDto } from '../dto/verify-customer.dto';

@Controller('verify-customer')
export class VerifyCustomerController {
  constructor(private readonly verifyCustomerService: VerifyCustomerService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  verifyClient(@Body() dto: verifyClientDto) {
    return this.verifyCustomerService.verifyCustomer(dto);
  }
}
