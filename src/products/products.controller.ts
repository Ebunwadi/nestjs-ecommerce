import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  HttpCode,
  UnauthorizedException,
  UseGuards,
  Patch,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  GetUser,
  UserInfo,
} from 'src/shared/middlewares/decorator/getUser.decorator';
import { userTypes } from 'src/shared/schema/users';
import { UserGuard } from 'src/user/guards/user.guard';
import { GetProductQueryDto } from './dto/get-product-query-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductSkuDtoArr } from './dto/product-sku.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(UserGuard)
  @Post()
  @HttpCode(201)
  async create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: UserInfo,
  ) {
    if (user.type !== userTypes.ADMIN) {
      throw new UnauthorizedException('you are not authorized to do this');
    }
    return await this.productsService.createProduct(createProductDto);
  }

  @UseGuards(UserGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: UserInfo,
  ) {
    if (user.type !== userTypes.ADMIN) {
      throw new UnauthorizedException('you are not authorized to do this');
    }
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @UseGuards(UserGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.productsService.removeProduct(id);
  }

  @Get()
  findAll(@Query() query: GetProductQueryDto) {
    return this.productsService.findAllProducts(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOneProduct(id);
  }

  @UseGuards(UserGuard)
  @Post('/:id/image')
  @UseInterceptors(
    FileInterceptor('productImage', {
      dest: '../uploads/',
      limits: {
        fileSize: 5545728, // 5 MB
      },
    }),
  )
  async uploadProductImage(
    @Param('id') id: string,
    @UploadedFile() file: ParameterDecorator,
    @GetUser() user: UserInfo,
  ) {
    if (user.type !== userTypes.ADMIN) {
      throw new UnauthorizedException('you are not authorized to do this');
    }
    return await this.productsService.uploadProductImage(id, file);
  }

  @Post('/:productId/skus')
  async updateProductSku(
    @Param('productId') productId: string,
    @Body() updateProductSkuDto: ProductSkuDtoArr,
    @GetUser() user: UserInfo,
  ) {
    if (user.type !== userTypes.ADMIN) {
      throw new UnauthorizedException('you are not authorized to do this');
    }
    return await this.productsService.updateProductSku(
      productId,
      updateProductSkuDto,
    );
  }

  // @Put('/:productId/skus/:skuId')
  // @Roles(userTypes.ADMIN)
  // async updateProductSkuById(
  //   @Param('productId') productId: string,
  //   @Param('skuId') skuId: string,
  //   @Body() updateProductSkuDto: ProductSkuDto,
  // ) {
  //   return await this.productsService.updateProductSkuById(
  //     productId,
  //     skuId,
  //     updateProductSkuDto,
  //   );
  // }

  // @Delete('/:productId/skus/:skuId')
  // @Roles(userTypes.ADMIN)
  // async deleteSkuById(
  //   @Param('productId') productId: string,
  //   @Param('skuId') skuId: string,
  // ) {
  //   return await this.productsService.deleteProductSkuById(productId, skuId);
  // }

  // @Post('/:productId/skus/:skuId/licenses')
  // @Roles(userTypes.ADMIN)
  // async addProductSkuLicense(
  //   @Param('productId') productId: string,
  //   @Param('skuId') skuId: string,
  //   @Body('licenseKey') licenseKey: string,
  // ) {
  //   return await this.productsService.addProductSkuLicense(
  //     productId,
  //     skuId,
  //     licenseKey,
  //   );
  // }

  // @Delete('/licenses/:licenseKeyId')
  // @Roles(userTypes.ADMIN)
  // async removeProductSkuLicense(@Param('licenseKeyId') licenseId: string) {
  //   return await this.productsService.removeProductSkuLicense(licenseId);
  // }

  // @Get('/:productId/skus/:skuId/licenses')
  // @Roles(userTypes.ADMIN)
  // async getProductSkuLicenses(
  //   @Param('productId') productId: string,
  //   @Param('skuId') skuId: string,
  // ) {
  //   return await this.productsService.getProductSkuLicenses(productId, skuId);
  // }

  // @Put('/:productId/skus/:skuId/licenses/:licenseKeyId')
  // @Roles(userTypes.ADMIN)
  // async updateProductSkuLicense(
  //   @Param('productId') productId: string,
  //   @Param('skuId') skuId: string,
  //   @Param('licenseKeyId') licenseKeyId: string,
  //   @Body('licenseKey') licenseKey: string,
  // ) {
  //   return await this.productsService.updateProductSkuLicense(
  //     productId,
  //     skuId,
  //     licenseKeyId,
  //     licenseKey,
  //   );
  // }

  // @Post('/:productId/reviews')
  // @Roles(userTypes.CUSTOMER)
  // async addProductReview(
  //   @Param('productId') productId: string,
  //   @Body('rating') rating: number,
  //   @Body('review') review: string,
  //   @Req() req: any,
  // ) {
  //   return await this.productsService.addProductReview(
  //     productId,
  //     rating,
  //     review,
  //     req.user,
  //   );
  // }

  //   @Delete('/:productId/reviews/:reviewId')
  //   async removeProductReview(
  //     @Param('productId') productId: string,
  //     @Param('reviewId') reviewId: string,
  //   ) {
  //     return await this.productsService.removeProductReview(productId, reviewId);
  //   }
}
