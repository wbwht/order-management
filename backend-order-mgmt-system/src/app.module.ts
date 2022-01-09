import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';

const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHostname = process.env.MONGO_HOSTNAME;
const mongoPort = process.env.MONGO_PORT;
const url = `mongodb://${mongoUser}:${mongoPassword}@${mongoHostname}:${mongoPort}/backend-order-mgmt-project?authSource=admin`;

@Module({
  imports: [
    MongooseModule.forRoot(
      url,
      // 'mongodb://app_user:app_password@mongodb:27017/backend-order-mgmt-project/?authSource=admin',
      // 'mongodb://app_user:app_password@127.0.0.1:27017/backend-order-mgmt-project',
      // 'mongodb://mongodb:27017/backend-order-mgmt-project',
      // 'mongodb://localhost:27017/backend-order-mgmt-project',
      // 'mongodb://127.0.0.1:27017/backend-order-mgmt-project',
      // 'mongodb://app_user:app_password@127.0.0.1:27017/backend-order-mgmt-project',
      {
        useNewUrlParser: true,
      },
    ),
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
