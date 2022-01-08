import { OrderStates } from 'src/schemas/orders.schema';

export class CreateOrderDto {
  states: OrderStates;
  readonly name: string;
  readonly amount: number;
  readonly datePosted: string;
}
