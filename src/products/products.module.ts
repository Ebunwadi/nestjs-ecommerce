import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductRepository } from 'src/shared/repository/product.repository';
import { UserRepository } from 'src/shared/repository/user.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, Users } from 'src/shared/schema/users';
import { Products, ProductSchema } from 'src/shared/schema/products';
import { ConfigService } from '@nestjs/config';
import { StripeModule } from 'nestjs-stripe';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductRepository, UserRepository],
  imports: [
    MongooseModule.forFeature([
      {
        name: Users.name,
        schema: UserSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Products.name,
        schema: ProductSchema,
      },
    ]),
    StripeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        apiKey: config.get<string>('STRIPE_SEC_KEY'),
        apiVersion: '2022-11-15',
      }),
    }),
  ],
})
export class ProductsModule {}
