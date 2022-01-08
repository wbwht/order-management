import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from './payment.service';
import { GetPaymentStatusDto } from './dto/get-payment-status.dto';
import { PaymentStates } from 'src/schemas/payment.schema';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern({ cmd: 'payment' })
  async getPaymentStatus(
    @Payload() getPaymentStatusDto: GetPaymentStatusDto,
  ): Promise<PaymentStates> {
    return await this.paymentService.getPaymentStatus(getPaymentStatusDto);
  }
}
