


// import { EmailService } from './../email/email.service';
// import { OtpService } from './../otp/otp.service';
// import { DeliveryPartnerService } from './../deliveryPartner/deliveryPartnerService';
// import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
// import { TokenService } from '../token/token.service';
// import { RegisterPartnerDto } from './dtos/registerPartnerDto';
// import { LoginPartnerDto } from './dtos/loginPartnerDto';
// import { PartnerDocuments } from './interfaces/partnerDocuments';
// import { ChangePasswordDto } from './dtos/changePasswordDto';
// import { ForgotPasswordDto } from './dtos/forgotPasswordDto';
// import { MongooseError, Types } from 'mongoose';
// import { RedisService } from '../redis/redisService';
// import { UpdatePasswordDto } from './dtos/updatePasswordDto';
// import { Role } from 'src/common/enums';
// import { Logger } from '@nestjs/common';
// import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// @Injectable()
// export class AuthService {
//   private readonly logger = new Logger(AuthService.name);

//   constructor(
//     private readonly tokenService: TokenService,
//     private readonly deliveryPartnerService: DeliveryPartnerService,
//     private readonly otpService: OtpService,
//     private readonly redisService: RedisService,
//     private readonly emailService: EmailService,
//   ) {}


//   async register(registerPartnerData: RegisterPartnerDto) {

//     this.logger.log('Registering new delivery partner');
//     const { email, mobileNumber, password, documents } = registerPartnerData;

//     const existed = await this.deliveryPartnerService.verifyPartnerRegistration(email, mobileNumber);
//     if (existed) {
//         this.logger.warn(`Registration failed: Email or mobile already in use - ${email}`);
//         throw new ConflictException('Email Or Mobile is in Use!!!');
//     }

//     const hashedPassword = await this.tokenService.hash(password);
//     const hashedRc = await this.tokenService.hash(documents.rc);
//     const hashedDl = await this.tokenService.hash(documents.dl);
//     const hashedAadhaar = await this.tokenService.hash(documents.aadhaar);

//     const doc: PartnerDocuments = {
//     rc: hashedRc,
//     aadhaar: hashedAadhaar,
//     dl: hashedDl,
//     };

//     await this.deliveryPartnerService.create({ ...registerPartnerData, password: hashedPassword, documents: doc });
//     this.logger.log('Partner registered successfully');
//     return {
//         message: 'Registration Successful',
//     };

//   }

//   async login(credentials: LoginPartnerDto) {
//     this.logger.log('Attempting partner login');
//     const { email, password } = credentials;

//     const existedPartner = await this.deliveryPartnerService.findByEmail(email);
//     if (!existedPartner) {
//         this.logger.warn(`Login failed: Partner not found - ${email}`);
//         throw new NotFoundException('Partner Not Found!!');
//     }

//     const validPassword = await this.tokenService.compare(password, existedPartner.password);
//     if (!validPassword) {
//         this.logger.warn(`Login failed: Incorrect password for ${email}`);
//         throw new UnauthorizedException('Incorrect Password!!');
//     }
//     existedPartner.isActive = true;
//     await existedPartner.save();

//     const payload = {
//         partnerId: existedPartner._id,
//         role: Role.DELIVERY_PARTNER,
//     };
    
//     const accessToken = await this.tokenService.sign(payload);
    
//     await this.redisService.setData(`login-${existedPartner._id}`, accessToken, 60 * 60 * 1000);
//     this.logger.log(`Partner logged in successfully: ${email}`);
    
//     return {
//         message: 'Login Successful!!',
//         accessToken,
//     };

//   }


//   async logout(partnerId: Types.ObjectId) {
//         this.logger.log(`Logging out partner: ${partnerId}`);
//         await this.redisService.deleteData(`login-${partnerId}`);
//         const partner = await this.deliveryPartnerService.findById(partnerId);
//         if (partner) {
//             partner.isActive = false;
//             await partner.save();
//             this.redisService.deleteData(`login-${partnerId}`)
//             this.logger.log(`Partner logged out successfully: ${partnerId}`);
//         } else {
//             this.logger.warn(`Logout failed: Partner not found - ${partnerId}`);
//             throw new NotFoundException('Partner Not Found!!');
//         }
//   }

//   async changePassword(partnerId: Types.ObjectId, changePasswordData: ChangePasswordDto) {
//     this.logger.log(`Changing password for partner: ${partnerId}`);
//     const { oldPassword, newPassword } = changePasswordData;

//       const partner = await this.deliveryPartnerService.findById(partnerId);
//       if (!partner) {
//         this.logger.warn(`Password change failed: Partner not found - ${partnerId}`);
//         throw new NotFoundException('User Not Found!!');
//       }

//       const validPassword = await this.tokenService.compare(oldPassword, partner.password);
//       if (!validPassword) {
//         this.logger.warn(`Password change failed: Incorrect password for ${partnerId}`);
//         throw new UnauthorizedException('Incorrect Password!!');
//       }

//       const hashedPassword = await this.tokenService.hash(newPassword);
//       partner.password = hashedPassword;
//       await partner.save();
//       this.logger.log(`Password changed successfully for ${partnerId}`);
//       return {
//         message: 'Password Changed Successfully!!',
//       };
   
//   }

//   async verifyOtp(partnerEmail: string, otp: string) {
//     this.logger.log(`Verifying OTP for email: ${partnerEmail}`);
  
//       const result = await this.otpService.verify(partnerEmail, otp);
//       this.logger.log(`OTP verified successfully for ${partnerEmail}`);
//       return result;
//   }

//   async sendOtp(partnerEmail: string) {
//     this.logger.log(`Sending OTP to email: ${partnerEmail}`);
//       await this.emailService.sendEmail(partnerEmail);
//       this.logger.log(`OTP sent successfully to ${partnerEmail}`);
//     }


//   async forgetPassword(forgotPasswordData: ForgotPasswordDto) {
//     this.logger.log('Initiating forgot password process');
//     const { email } = forgotPasswordData;
//       const existingPartner = await this.deliveryPartnerService.findByEmail(email);
//       if (!existingPartner) {
//         this.logger.warn(`Forgot password failed: Partner not found - ${email}`);
//         throw new NotFoundException('User Not Found!!');
//       }

//       await this.emailService.sendEmail(email);
//       const payload = { partnerEmail: email };
//       const accessToken = await this.tokenService.sign(payload, '5m');
//       this.logger.log(`Forgot password OTP sent for ${email}`);
//       return { accessToken };
//   }

//   async updatePassword(partnerEmail: string, updatePasswordData: UpdatePasswordDto) {
//     this.logger.log(`Updating password for email: ${partnerEmail}`);
//     const { newPassword } = updatePasswordData;
//       const partner = await this.deliveryPartnerService.findByEmail(partnerEmail);
//       if (!partner) {
//         this.logger.warn(`Password update failed: Partner not found - ${partnerEmail}`);
//         throw new NotFoundException('Partner Not Found!!');
//       }

//       const hashedPassword = await this.tokenService.hash(newPassword);
//       partner.password = hashedPassword;
//       await partner.save();
//       this.logger.log(`Password reset successfully for ${partnerEmail}`);
//       return {
//         message: 'Password Resets Successfully!!!',
//       };
//   }
// }

import { EmailService } from './../email/email.service';
import { OtpService } from './../otp/otp.service';
import { DeliveryPartnerService } from './../deliveryPartner/deliveryPartnerService';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { RegisterPartnerDto } from './dtos/registerPartnerDto';
import { LoginPartnerDto } from './dtos/loginPartnerDto';
import { PartnerDocuments } from './interfaces/partnerDocuments';
import { ChangePasswordDto } from './dtos/changePasswordDto';
import { ForgotPasswordDto } from './dtos/forgotPasswordDto';
import { Types } from 'mongoose';
import { RedisService } from '../redis/redisService';
import { UpdatePasswordDto } from './dtos/updatePasswordDto';
import { Logger } from '@nestjs/common';
import { AUTH_CONSTANTS } from './authConstants';
import { Role } from 'src/common/enums';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly deliveryPartnerService: DeliveryPartnerService,
    private readonly otpService: OtpService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerPartnerData: RegisterPartnerDto) {
    this.logger.log('Registering new delivery partner');
    const { email, mobileNumber, password, documents } = registerPartnerData;

    const existed = await this.deliveryPartnerService.verifyPartnerRegistration(email, mobileNumber);
    if (existed) {
      this.logger.warn(`Registration failed: Email or mobile already in use - ${email}`);
      throw new ConflictException(AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_OR_MOBILE_IN_USE);
    }

    const hashedPassword = await this.tokenService.hash(password);
    const hashedRc = await this.tokenService.hash(documents.rc);
    const hashedDl = await this.tokenService.hash(documents.dl);
    const hashedAadhaar = await this.tokenService.hash(documents.aadhaar);

    const doc: PartnerDocuments = {
      rc: hashedRc,
      aadhaar: hashedAadhaar,
      dl: hashedDl,
    };

    await this.deliveryPartnerService.create({ ...registerPartnerData, password: hashedPassword, documents: doc });
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_REGISTER);
    return {
      success: true,
      message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_REGISTER,
    };
  }

  async login(credentials: LoginPartnerDto) {
    this.logger.log('Attempting partner login');
    const { email, password } = credentials;

    const existedPartner = await this.deliveryPartnerService.findByEmail(email);
    if (!existedPartner) {
      this.logger.warn(`Login failed: Partner not found - ${email}`);
      throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
    }

    const validPassword = await this.tokenService.compare(password, existedPartner.password);
    if (!validPassword) {
      this.logger.warn(`Login failed: Incorrect password for ${email}`);
      throw new UnauthorizedException(AUTH_CONSTANTS.MESSAGES.ERROR.INCORRECT_PASSWORD);
    }
    existedPartner.isActive = true;
    await existedPartner.save();

    const payload = {
      partnerId: existedPartner._id,
      role: Role.DELIVERY_PARTNER
    };

    const accessToken = await this.tokenService.sign(payload);

    await this.redisService.setData(
      `${AUTH_CONSTANTS.REDIS.LOGIN_KEY_PREFIX}${existedPartner._id}`,
      accessToken,
      AUTH_CONSTANTS.REDIS.LOGIN_TOKEN_TTL
    );
    this.logger.log(`Partner logged in successfully: ${email}`);

    return {
      success: true,
      message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_LOGIN,
      accessToken,
    };
  }

  async logout(partnerId: Types.ObjectId) {
    this.logger.log(`Logging out partner: ${partnerId}`);
    await this.redisService.deleteData(`${AUTH_CONSTANTS.REDIS.LOGIN_KEY_PREFIX}${partnerId}`);
    const partner = await this.deliveryPartnerService.findById(partnerId);
    if (partner) {
      partner.isActive = false;
      await partner.save();
      this.redisService.deleteData(`${AUTH_CONSTANTS.REDIS.LOGIN_KEY_PREFIX}${partnerId}`);
      this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGOUT);
    } else {
      this.logger.warn(`Logout failed: Partner not found - ${partnerId}`);
      throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
    }
  }

  async changePassword(partnerId: Types.ObjectId, changePasswordData: ChangePasswordDto) {
    this.logger.log(`Changing password for partner: ${partnerId}`);
    const { oldPassword, newPassword } = changePasswordData;

    const partner = await this.deliveryPartnerService.findById(partnerId);
    if (!partner) {
      this.logger.warn(`Password change failed: Partner not found - ${partnerId}`);
      throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
    }

    const validPassword = await this.tokenService.compare(oldPassword, partner.password);
    if (!validPassword) {
      this.logger.warn(`Password change failed: Incorrect password for ${partnerId}`);
      throw new UnauthorizedException(AUTH_CONSTANTS.MESSAGES.ERROR.INCORRECT_PASSWORD);
    }

    const hashedPassword = await this.tokenService.hash(newPassword);
    partner.password = hashedPassword;
    await partner.save();
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_CHANGE_PASSWORD);
    return {
      message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_CHANGE_PASSWORD,
    };
  }

  async verifyOtp(partnerEmail: string, otp: string) {
    this.logger.log(`Verifying OTP for email: ${partnerEmail}`);
    const result = await this.otpService.verify(partnerEmail, otp);
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.VERIFY_OTP);
    return result;
  }

  async sendOtp(partnerEmail: string) {
    this.logger.log(`Sending OTP to email: ${partnerEmail}`);
    await this.emailService.sendEmail(partnerEmail);
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.SEND_OTP);
  }

  async forgetPassword(forgotPasswordData: ForgotPasswordDto) {
    this.logger.log('Initiating forgot password process');
    const { email } = forgotPasswordData;
    const existingPartner = await this.deliveryPartnerService.findByEmail(email);
    if (!existingPartner) {
      this.logger.warn(`Forgot password failed: Partner not found - ${email}`);
      throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
    }

    await this.emailService.sendEmail(email);
    const payload = { partnerEmail: email };
    const accessToken = await this.tokenService.sign(payload, AUTH_CONSTANTS.TOKEN.FORGOT_PASSWORD_TOKEN_EXPIRY);
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.FORGOT_PASSWORD);
    return { accessToken };
  }

  async updatePassword(partnerEmail: string, updatePasswordData: UpdatePasswordDto) {
    this.logger.log(`Updating password for email: ${partnerEmail}`);
    const { newPassword } = updatePasswordData;
    const partner = await this.deliveryPartnerService.findByEmail(partnerEmail);
    if (!partner) {
      this.logger.warn(`Password update failed: Partner not found - ${partnerEmail}`);
      throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
    }

    const hashedPassword = await this.tokenService.hash(newPassword);
    partner.password = hashedPassword;
    await partner.save();
    this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_UPDATE_PASSWORD);
    return {
      message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_UPDATE_PASSWORD,
    };
  }
}