import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema as MongooseSchema } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStates,
  PaymentStates,
} from '../schemas/orders.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @Inject('PAYMENT_SERVICE') private client: ClientProxy,
  ) {}

  // Main functionalities
  async create(createOrderDto: CreateOrderDto) {
    createOrderDto.states = OrderStates.ORDER_CREATED;
    const createdOrder = await this.orderModel.create(createOrderDto);
    console.log('Created an order ' + JSON.stringify(createdOrder));
    await this.getPayment(createdOrder);
  }

  async getPayment(createdOrder) {
    const message = await this.client.send({ cmd: 'payment' }, 'Dummy Pin');
    await message.subscribe(async (paymentState) => {
      switch (paymentState) {
        case PaymentStates.PAYMENT_CONFIRMED:
          createdOrder.states = OrderStates.ORDER_CONFIRMED;
          break;
        case PaymentStates.PAYMENT_DECLINED:
          createdOrder.states = OrderStates.ORDER_CANCELLED;
          break;
        default:
          createdOrder.states = OrderStates.ORDER_UNDEFINED;
          break;
      }
      console.log(
        'Payment status obtained and updating it with: ' +
          JSON.stringify(createdOrder),
      );
      await this.update(createdOrder._id, createdOrder);
      await this.waitForOrderDelivered(createdOrder);
    });
    return message;
  }
  async waitForOrderDelivered(createdOrder) {
    console.log('Start timer...');
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));
    await wait(3000);
    createdOrder.states = OrderStates.ORDER_DELIVERED;
    console.log('Waited for 3s and updated: ' + JSON.stringify(createdOrder));
    await this.update(createdOrder._id, createdOrder);
    // return await this.update(createdOrder._id, createdOrder);
  }

  async cancelOrder(
    id: MongooseSchema.Types.ObjectId,
    updateOrderDto: UpdateOrderDto,
  ) {
    updateOrderDto.states = OrderStates.ORDER_CANCELLED;
    await this.update(id, updateOrderDto);
    console.log('Cancelling order & Update ' + id + ' order');
    // return editedOrder;
  }

  async findOneOrderStatus(
    id: MongooseSchema.Types.ObjectId,
  ): Promise<OrderStates> {
    const order = await this.findOne(id);
    return order.states;
  }

  // DB Helper functionalities
  async findAll(): Promise<Order[]> {
    const orders = await this.orderModel.find().exec();
    console.log('Find all orders' + JSON.stringify(orders));
    return orders;
  }

  async findOne(id: MongooseSchema.Types.ObjectId): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    console.log('Find order with id: ' + id + ' ' + JSON.stringify(order));
    return order;
  }

  async update(
    id: MongooseSchema.Types.ObjectId,
    updateOrderDto: UpdateOrderDto,
  ) {
    const editedOrder = await this.orderModel.findByIdAndUpdate(
      id,
      updateOrderDto,
      { new: true },
    );
    console.log('Updated with: ' + JSON.stringify(editedOrder));
    return editedOrder;
  }

  async remove(id: MongooseSchema.Types.ObjectId): Promise<any> {
    const removedOrder = await this.orderModel.findByIdAndRemove(id);
    console.log('Removes ' + id + ' order');
    return removedOrder;
  }
}
