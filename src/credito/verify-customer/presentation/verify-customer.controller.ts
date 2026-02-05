import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { VerifyCustomerService } from '../app/verify-customer.service';

@Controller('verify-customer')
export class VerifyCustomerController {
  constructor(private readonly verifyCustomerService: VerifyCustomerService) {}

  @Get(':id')
  async verifyClient(@Param('id', ParseIntPipe) id: number) {
    return await this.verifyCustomerService.verifyCustomer(id);
  }
}
