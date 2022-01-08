import { ClientProxy } from '@nestjs/microservices';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import {
  OrderDocument,
  OrderStates,
  PaymentStates,
} from '../schemas/orders.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { of } from 'rxjs';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockedModel: Model<OrderDocument>;
  let mockedClient: ClientProxy;
  const mockOrder = {
    _id: 123,
    states: OrderStates.ORDER_UNDEFINED,
    name: 'Order Sample Name',
    amount: '99.90',
    datePosted: '12 Dec',
  };

  const createOrderDto: CreateOrderDto = {
    name: 'Order name',
    amount: 70,
    states: OrderStates.ORDER_UNDEFINED,
    datePosted: 'today',
  };

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

    service = module.get<OrdersService>(OrdersService);
    mockedModel = module.get<Model<OrderDocument>>(getModelToken('Order'));
    mockedClient = module.get<ClientProxy>('PAYMENT_SERVICE');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create( )', () => {
    it('should create a new order in DB with ORDER_CREATED state', async () => {
      jest.spyOn(mockedModel, 'create');
      const getPaymentSpy = jest.spyOn(service, 'getPayment').mockReturnThis();

      // Actuall calls
      await service.create(createOrderDto);

      // Expectations
      const expectedCreateOrderDto: CreateOrderDto = {
        name: 'Order name',
        amount: 70,
        states: OrderStates.ORDER_CREATED,
        datePosted: 'today',
      };
      expect(mockedModel.create).toHaveBeenCalled();
      expect(mockedModel.create).toHaveBeenCalledWith(expectedCreateOrderDto);
      expect(getPaymentSpy).toHaveBeenCalled();
    });
  });

  describe('getPayment( )', () => {
    it('should call payment microservices app', async () => {
      jest.spyOn(service, 'update').mockReturnThis();
      jest.spyOn(service, 'waitForOrderDelivered').mockReturnThis();
      const clientProxySpy = jest
        .spyOn(mockedClient, 'send')
        .mockImplementationOnce(() => of(PaymentStates.PAYMENT_CONFIRMED));

      // Actuall calls
      await service.getPayment(mockOrder);

      // Expectations
      expect(clientProxySpy).toHaveBeenCalled();
      expect(clientProxySpy).toHaveBeenCalledWith(
        { cmd: 'payment' },
        'Dummy Pin',
      );
    });
    it('should update db with expected data', async () => {
      jest.spyOn(service, 'waitForOrderDelivered').mockReturnThis();
      const modelUpdate = jest.spyOn(service, 'update').mockReturnThis();
      jest
        .spyOn(mockedClient, 'send')
        .mockImplementationOnce(() => of(PaymentStates.PAYMENT_CONFIRMED));

      // Actuall calls
      await service.getPayment(mockOrder);

      // Expectations
      const expectedCreateOrder = {
        _id: 123,
        states: OrderStates.ORDER_CONFIRMED,
        name: 'Order Sample Name',
        amount: '99.90',
        datePosted: '12 Dec',
      };
      expect(modelUpdate).toHaveBeenCalled();
      expect(modelUpdate).toHaveBeenCalledWith(
        expectedCreateOrder._id,
        expectedCreateOrder,
      );
    });
    it('should update db with UNDEFINED if paymentState invalid', async () => {
      jest.spyOn(service, 'waitForOrderDelivered').mockReturnThis();
      const modelUpdate = jest.spyOn(service, 'update').mockReturnThis();
      jest
        .spyOn(mockedClient, 'send')
        .mockImplementationOnce(() => of('Random values'));

      // Actuall calls
      await service.getPayment(mockOrder);

      // Expectations
      const expectedCreateOrder = {
        _id: 123,
        states: OrderStates.ORDER_UNDEFINED,
        name: 'Order Sample Name',
        amount: '99.90',
        datePosted: '12 Dec',
      };
      expect(modelUpdate).toHaveBeenCalled();
      expect(modelUpdate).toHaveBeenCalledWith(
        expectedCreateOrder._id,
        expectedCreateOrder,
      );
    });
    it('should process payment and return RANDOM(confirmed) response', async () => {
      jest.spyOn(service, 'waitForOrderDelivered').mockReturnThis();
      jest.spyOn(service, 'update').mockReturnThis();
      jest
        .spyOn(mockedClient, 'send')
        .mockImplementationOnce(() => of(PaymentStates.PAYMENT_CONFIRMED));

      // Actuall calls
      const observableReturn = await service.getPayment(mockOrder);

      // Expectations
      observableReturn.subscribe((res) => {
        expect(res).toEqual(PaymentStates.PAYMENT_CONFIRMED);
      });
    });
    it('should process payment and return RANDOM(declined) response', async () => {
      jest.spyOn(service, 'waitForOrderDelivered').mockReturnThis();
      jest.spyOn(service, 'update').mockReturnThis();
      jest
        .spyOn(mockedClient, 'send')
        .mockImplementationOnce(() => of(PaymentStates.PAYMENT_DECLINED));

      // Actuall calls
      const observableReturn = await service.getPayment(mockOrder);

      // Expectations
      observableReturn.subscribe((res) => {
        expect(res).toEqual(PaymentStates.PAYMENT_DECLINED);
      });
    });
  });

  describe('waitForOrderDelivered( )', () => {
    it('should wait for timeout', async () => {
      jest.spyOn(service, 'update');
      jest.spyOn(global, 'setTimeout');

      // Actuall calls
      await service.waitForOrderDelivered(mockOrder);

      // Expectations
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 3000);
    });
    it('should set order to delivered', async () => {
      jest.spyOn(global, 'setTimeout');
      const serviceUpdate = jest.spyOn(service, 'update');

      // Actuall calls
      await service.waitForOrderDelivered(mockOrder);

      // Expectations
      const expectedCreateOrder = {
        _id: 123,
        states: OrderStates.ORDER_DELIVERED,
        name: 'Order Sample Name',
        amount: '99.90',
        datePosted: '12 Dec',
      };
      expect(serviceUpdate).toHaveBeenCalled();
      expect(serviceUpdate).toHaveBeenCalledWith(
        expectedCreateOrder._id,
        expectedCreateOrder,
      );
    });
  });

  describe('cancelOrder( )', () => {
    it('should change order state to CANCELLED', async () => {
      const modelUpdate = jest.spyOn(mockedModel, 'findByIdAndUpdate');

      // Actuall calls
      await service.cancelOrder(Number(mockOrder._id), createOrderDto);

      // Expectations
      const expectedUpdatedOrder = {
        name: 'Order name',
        amount: 70,
        states: OrderStates.ORDER_CANCELLED,
        datePosted: 'today',
      };
      expect(modelUpdate).toHaveBeenCalled();
      expect(modelUpdate).toHaveBeenCalledWith(
        Number(mockOrder._id),
        expectedUpdatedOrder,
        { new: true },
      );
    });
  });

  describe('findOneOrderStatus( )', () => {
    it('should return expected order states', async () => {
      const mockOrder = {
        _id: '128',
        states: OrderStates.ORDER_UNDEFINED,
        name: 'Order Sample Name',
        amount: '99.90',
        datePosted: '12 Dec',
      };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockOrder as any);

      // Actual calls
      const retStates = await service.findOneOrderStatus(Number(mockOrder._id));

      // Expectations
      expect(retStates).toEqual(OrderStates.ORDER_UNDEFINED);
    });
  });
  describe('findAll( )', () => {
    it('should return an array of orders', async () => {
      jest.spyOn(mockedModel, 'find').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockOrder),
      } as any);

      // Actual calls
      const retOrderArray = await service.findAll();

      // Expectations
      expect(retOrderArray).toBeDefined();
    });
  });
  describe('findOne( )', () => {
    it('should return an array of orders', async () => {
      const mockOrder = {
        _id: 128,
        states: OrderStates.ORDER_UNDEFINED,
        name: 'Order Sample Name',
        amount: '99.90',
        datePosted: '12 Dec',
      };
      jest.spyOn(mockedModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockOrder),
      } as any);

      // Actual calls
      const retStates = await service.findOne(mockOrder._id);

      // Expectations
      expect(retStates).toEqual(mockOrder);
    });
  });
  describe('update( )', () => {
    it('should call findByIdAndUpdate', async () => {
      const modelUpdate = jest
        .spyOn(mockedModel, 'findByIdAndUpdate')
        .mockResolvedValueOnce(mockOrder as any);

      // Actual calls
      await service.update(mockOrder._id, createOrderDto);

      // Expectations
      expect(modelUpdate).toHaveBeenCalled();
      expect(modelUpdate).toHaveBeenCalledWith(mockOrder._id, createOrderDto, {
        new: true,
      });
    });
  });
  describe('remove( )', () => {
    it('should call findByIdAndRemove', async () => {
      const modelUpdate = jest
        .spyOn(mockedModel, 'findByIdAndRemove')
        .mockResolvedValueOnce(mockOrder as any);

      // Actual calls
      await service.remove(mockOrder._id);

      // Expectations
      expect(modelUpdate).toHaveBeenCalled();
      expect(modelUpdate).toHaveBeenCalledWith(mockOrder._id);
    });
  });
});
