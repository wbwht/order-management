import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Model, Schema as MongooseSchema } from 'mongoose';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Main functionalities
  @Post()
  async create(@Res() res, @Body() createOrderDto: CreateOrderDto) {
    const newOrder = await this.ordersService.create(createOrderDto);
    return res.status(HttpStatus.OK).json({
      message: 'Post has been submitted successfully!',
      post: newOrder,
    });
  }

  @Patch('/cancel/:id')
  async cancelOrder(
    @Res() res,
    @Param('id') id: MongooseSchema.Types.ObjectId,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    await this.ordersService.cancelOrder(id, updateOrderDto);
    return res.status(HttpStatus.OK).json({
      message: 'Post has been cancelled successfully!',
    });
  }

  @Get('/status/:id')
  async findOneOrderStatus(
    @Res() res,
    @Param('id') id: MongooseSchema.Types.ObjectId,
  ) {
    const order = await this.ordersService.findOne(id);
    if (!order) throw new NotFoundException('Post does not exist');
    return res.status(HttpStatus.OK).json(order);
  }

  // Helper functionalities
  @Get()
  async findAll(@Res() res) {
    const orders = await this.ordersService.findAll();
    return res.status(HttpStatus.OK).json(orders);
  }

  @Get(':id')
  async findOne(@Res() res, @Param('id') id: MongooseSchema.Types.ObjectId) {
    const order = await this.ordersService.findOne(id);
    if (!order) throw new NotFoundException('Post does not exist');
    return res.status(HttpStatus.OK).json(order);
  }

  @Patch(':id')
  update(
    @Param('id') id: MongooseSchema.Types.ObjectId,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: MongooseSchema.Types.ObjectId) {
    return this.ordersService.remove(id);
  }
}
