import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { PaymentStates } from '../schemas/orders.schema';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  class OrderModel {
    constructor(private data) {}
    save = jest.fn();
    static find = jest.fn();
    static findByIdAndUpdate = jest.fn();
    static findByIdAndRemove = jest.fn();
    static findById = jest.fn();
    static findOne = jest.fn();
    static findOneAndUpdate = jest.fn();
    static deleteOne = jest.fn();
    static create = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        OrdersService,
        {
          provide: getModelToken('Order'),
          useValue: OrderModel,
        },
        {
          provide: 'PAYMENT_SERVICE',
          useValue: {
            send: () =>
              of({
                subscribe: PaymentStates.PAYMENT_CONFIRMED,
              }),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
