import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { VerifyCustomerService } from '../app/verify-customer.service';
import { verifyClientDto } from '../dto/verify-customer.dto';

@Controller('verify-customer')
export class VerifyCustomerController {
  constructor(private readonly verifyCustomerService: VerifyCustomerService) {}

  @Post()
  async verifyClient(@Body() dto: verifyClientDto) {
    return await this.verifyCustomerService.verifyCustomer(dto);
  }
}
