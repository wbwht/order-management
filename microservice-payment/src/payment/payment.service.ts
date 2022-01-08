import { Injectable } from '@nestjs/common';
import { PaymentStates } from 'src/schemas/payment.schema';
import { GetPaymentStatusDto } from './dto/get-payment-status.dto';

@Injectable()
export class PaymentService {
  private paymentConfirmed = false;

  async getPaymentStatus(
    getPaymentStatusDto: GetPaymentStatusDto,
  ): Promise<PaymentStates> {
    // Mock processing
    console.log('Processing payment...');
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));
    await wait(3000);

    // Payment process an order and returns random response
    let ret = null;
    if (this.paymentConfirmed) {
      ret = PaymentStates.PAYMENT_CONFIRMED;
    } else {
      ret = PaymentStates.PAYMENT_DECLINED;
    }
    this.paymentConfirmed = !this.paymentConfirmed;
    console.log(JSON.stringify(getPaymentStatusDto));
    return ret;
  }
}
