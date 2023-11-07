import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Res,
  Get,
  Param,
  Patch,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Response } from 'express';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  GetUser,
  UserInfo,
} from 'src/shared/middlewares/decorator/getUser.decorator';
import { userTypes } from 'src/shared/schema/users';
import { UserGuard } from './guards/user.guard';
// import { UserGuard } from './interceptors/user.interceptor';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/signUp')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUser: { email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const loginRes = await this.userService.login(
      loginUser.email,
      loginUser.password,
    );
    if (loginRes.success) {
      response.cookie('access_token', loginRes.result?.token, {
        httpOnly: true,
      });
    }
    // delete loginRes.result?.token;
    return loginRes;
  }

  @Get('/verifyEmail/:id/:otp')
  async verifyEmail(@Param('otp') otp: string, @Param('id') id: string) {
    return await this.userService.verifyEmail(id, otp);
  }

  @Post('/logout')
  async logout(@Res() res: Response) {
    res.clearCookie('access_token');
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Logout successfully',
    });
  }

  @Get('send-otp-email/:id')
  async sendOtpEmail(@Param('id') email: string) {
    return await this.userService.sendOtpEmail(email);
  }

  @Get('forgot-password/:id')
  async forgotPassword(@Param('id') email: string) {
    return await this.userService.forgotPassword(email);
  }

  @UseGuards(UserGuard)
  @Get()
  async findAll(@Query('type') type: string, @GetUser() user: UserInfo) {
    if (user?.type !== userTypes.ADMIN) {
      throw new UnauthorizedException('you are not authorized to do this');
    }
    return await this.userService.findAll(type);
  }

  @Patch('/update-name-password/:id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updatePasswordOrName(id, updateUserDto);
  }
}
