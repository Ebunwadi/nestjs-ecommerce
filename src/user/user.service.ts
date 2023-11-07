import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from 'src/shared/repository/user.repository';
import {
  comparePassword,
  generateHashPassword,
} from 'src/shared/utility/password-manager';
import { userTypes } from 'src/shared/schema/users';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import mongoose from 'mongoose';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userDB: UserRepository,
    private config: ConfigService,
    private jwt: JwtService,
    private mailerService: MailerService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      // generate the hash password
      createUserDto.password = await generateHashPassword(
        createUserDto.password,
      );

      // check if user wants to signup as admin
      if (
        createUserDto.type === userTypes.ADMIN &&
        createUserDto.secretToken !== this.config.get('ADMIN_SECRET_TOKEN')
      ) {
        throw new UnauthorizedException('you cannot signup as an admin');
      } else if (createUserDto.type !== userTypes.CUSTOMER) {
        createUserDto.isVerified = true;
      }

      // check if user already exist
      const user = await this.userDB.findOne({
        email: createUserDto.email,
      });
      if (user) {
        throw new ConflictException('User already exists');
      }

      // generate the otp
      const otp = Math.floor(Math.random() * 900000) + 100000;

      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 30);

      const newUser = await this.userDB.create({
        ...createUserDto,
        otp,
        otpExpiryTime,
      });
      const id = newUser._id;
      const url = `${this.config.get('BASE_URL')}/verifyEmail/${id}/${otp}`;
      if (newUser.type !== userTypes.ADMIN) {
        this.sendEmail(
          createUserDto.email,
          'OTP Verification',
          `hi ${createUserDto.name}, thanks for signing up to our website, please click on this link: ${url} to verify your email, the link expires in 10mins`,
        );
      }
      return {
        success: true,
        message:
          newUser.type === userTypes.ADMIN
            ? 'Admin created successfully'
            : 'Please activate your account by verifying your email. We have sent you an email with the otp',
        result: { email: newUser.email },
      };
    } catch (error) {
      throw error;
    }
  }

  sendEmail(email: string, subject: string, text: string) {
    const mailOptions = {
      from: this.config.get('MAIL_USER'),
      to: email,
      subject,
      text,
    };

    this.mailerService.sendMail(mailOptions);
  }

  async login(email: string, password: string) {
    try {
      const userExists = await this.userDB.findOne({
        email,
      });
      if (!userExists) throw new ForbiddenException('Credentials incorrect');
      if (!userExists.isVerified) {
        throw new ForbiddenException('Please verify your email');
      }

      const isPasswordMatch = await comparePassword(
        userExists.password,
        password,
      );
      if (!isPasswordMatch) {
        throw new ForbiddenException('Credentials incorrect');
      }
      const secret = this.config.get('JWT_SECRET');
      const id = userExists._id;

      const token = this.jwt.sign(
        { id },
        {
          expiresIn: '24h',
          secret,
        },
      );
      return {
        success: true,
        message: 'Login successful',
        result: {
          user: {
            name: userExists.name,
            email: userExists.email,
            type: userExists.type,
            id: userExists._id.toString(),
          },
          token,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // async signToken(userId: number): Promise<string> {
  //   const secret = this.config.get('JWT_SECRET');

  //   return this.jwt.sign(
  //     { userId },
  //     {
  //       expiresIn: '15m',
  //       secret,
  //     },
  //   );
  // }

  async verifyEmail(id: string, otp: string) {
    try {
      if (!mongoose.isValidObjectId(id)) {
        throw new BadRequestException('incorrect params');
      }
      const user = await this.userDB.findOne({
        _id: id,
      });
      if (!user) {
        throw new ForbiddenException('User not found');
      }
      if (user.otp !== otp) {
        throw new ForbiddenException('Invalid otp');
      }
      if (user.otpExpiryTime < new Date()) {
        throw new BadRequestException('Otp expired');
      }
      await this.userDB.updateOne(
        {
          _id: id,
        },
        {
          isVerified: true,
        },
      );

      return {
        success: true,
        message: 'Email verified successfully. you can login now',
      };
    } catch (error) {
      throw error;
    }
  }

  async sendOtpEmail(id: string) {
    try {
      const user = await this.userDB.findOne({
        _id: id,
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      if (user.isVerified) {
        throw new ConflictException('Email already verified');
      }
      const otp = Math.floor(Math.random() * 900000) + 100000;

      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 20);

      await this.userDB.updateOne(
        {
          _id: id,
        },
        {
          otp,
          otpExpiryTime,
        },
      );
      const url = `${this.config.get('BASE_URL')}/verifyEmail/${id}/${otp}`;
      this.sendEmail(
        user.email,
        'OTP Verification',
        `hi ${user.name}, thanks for signing up to our website, please click on this link: ${url} to verify your email, the link expires in 10mins`,
      );

      return {
        success: true,
        message: 'verification mail sent successfully',
        result: { email: user.email },
      };
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(id: string) {
    try {
      const user = await this.userDB.findOne({
        _id: id,
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      let password = Math.random().toString(36).substring(2, 12);
      const tempPassword = password;
      password = await generateHashPassword(password);
      await this.userDB.updateOne(
        {
          _id: user._id,
        },
        {
          password,
        },
      );

      this.sendEmail(
        user.email,
        'OTP Verification',
        `hi ${user.name}, here is your new password ${tempPassword}, do update it after you login`,
      );
      return {
        success: true,
        message: 'Password sent to your email',
        result: { email: user.email },
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(type: string) {
    try {
      const users = await this.userDB.find({
        type,
      });
      if (users.length === 0) {
        return { message: `no user of type ${type} found` };
      }
      return {
        success: true,
        message: 'Users fetched successfully',
        result: users,
      };
    } catch (error) {
      throw error;
    }
  }

  async updatePasswordOrName(
    id: string,
    updatePasswordOrNameDto: UpdateUserDto,
  ) {
    try {
      const { oldPassword, newPassword, name } = updatePasswordOrNameDto;
      if (!name || !newPassword) {
        throw new BadRequestException('Please provide name or password');
      }
      const user = await this.userDB.findOne({
        _id: id,
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      if (newPassword) {
        const isPasswordMatch = await comparePassword(
          user.password,
          oldPassword,
        );
        if (!isPasswordMatch) {
          throw new BadRequestException('Invalid current password');
        }
        const password = await generateHashPassword(newPassword);
        await this.userDB.updateOne(
          {
            _id: id,
          },
          {
            password,
          },
        );
      }
      if (name) {
        await this.userDB.updateOne(
          {
            _id: id,
          },
          {
            name,
          },
        );
      }
      return {
        success: true,
        message: 'User updated successfully',
        result: {
          name: user.name,
          email: user.email,
          type: user.type,
          id: user._id.toString(),
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
