import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema()
export class Order {
  _id!: MongooseSchema.Types.ObjectId;

  @Prop()
  states: OrderStates;

  @Prop()
  name: string;

  @Prop()
  amount: number;

  @Prop()
  datePosted: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

export enum OrderStates {
  ORDER_CREATED = 'Order_Created',
  ORDER_CONFIRMED = 'Order_Confirmed',
  ORDER_CANCELLED = 'Order_Cancelled',
  ORDER_DELIVERED = 'Order_Delivered',
  ORDER_UNDEFINED = 'Order_Undefined',
}

export enum PaymentStates {
  PAYMENT_DECLINED = 'Payment_Declined',
  PAYMENT_CONFIRMED = 'Payment_Confirmed',
}
