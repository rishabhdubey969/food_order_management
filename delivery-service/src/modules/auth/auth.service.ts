
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
// import { Types } from 'mongoose';
// import { RedisService } from '../redis/redisService';
// import { UpdatePasswordDto } from './dtos/updatePasswordDto';
// import { Logger } from '@nestjs/common';
// import { AUTH_CONSTANTS } from './authConstants';
// import { Role } from 'src/common/enums';


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
//       this.logger.warn(`Registration failed: Email or mobile already in use - ${email}`);
//       throw new ConflictException(AUTH_CONSTANTS.MESSAGES.ERROR.EMAIL_OR_MOBILE_IN_USE);
//     }

//     const hashedPassword = await this.tokenService.hash(password);
//     const hashedRc = await this.tokenService.hash(documents.rc);
//     const hashedDl = await this.tokenService.hash(documents.dl);
//     const hashedAadhaar = await this.tokenService.hash(documents.aadhaar);

//     const doc: PartnerDocuments = {
//       rc: hashedRc,
//       aadhaar: hashedAadhaar,
//       dl: hashedDl,
//     };

//     await this.deliveryPartnerService.create({ ...registerPartnerData, password: hashedPassword, documents: doc });
//     this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_REGISTER);
//     return {
//       success: true,
//       message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_REGISTER,
//     };
//   }

//   async login(credentials: LoginPartnerDto) {
//     this.logger.log('Attempting partner login');
//     const { email, password } = credentials;

//     const existedPartner = await this.deliveryPartnerService.findByEmail(email);
//     if (!existedPartner) {
//       this.logger.warn(`Login failed: Partner not found - ${email}`);
//       throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
//     }

//     const validPassword = await this.tokenService.compare(password, existedPartner.password);
//     if (!validPassword) {
//       this.logger.warn(`Login failed: Incorrect password for ${email}`);
//       throw new UnauthorizedException(AUTH_CONSTANTS.MESSAGES.ERROR.INCORRECT_PASSWORD);
//     }
//     existedPartner.isActive = true;
//     await existedPartner.save();

//     const payload = {
//       partnerId: existedPartner._id,
//       role: Role.DELIVERY_PARTNER
//     };

//     const accessToken = await this.tokenService.sign(payload);

//     await this.redisService.setData(
//       `${AUTH_CONSTANTS.REDIS.LOGIN_KEY_PREFIX}${existedPartner._id}`,
//       accessToken,
//       AUTH_CONSTANTS.REDIS.LOGIN_TOKEN_TTL
//     );
//     this.logger.log(`Partner logged in successfully: ${email}`);

//     return {
//       success: true,
//       message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_LOGIN,
//       accessToken,
//     };
//   }

//   async logout(partnerId: Types.ObjectId) {
//     this.logger.log(`Logging out partner: ${partnerId}`);
//     await this.redisService.deleteData(`${AUTH_CONSTANTS.REDIS.LOGIN_KEY_PREFIX}${partnerId}`);
//     const partner = await this.deliveryPartnerService.findById(partnerId);
//     if (partner) {
//       partner.isActive = false;
//       await partner.save();
//       this.redisService.deleteData(`${AUTH_CONSTANTS.REDIS.LOGIN_KEY_PREFIX}${partnerId}`);
//       this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGOUT);
//     } else {
//       this.logger.warn(`Logout failed: Partner not found - ${partnerId}`);
//       throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
//     }
//   }

//   async changePassword(partnerId: Types.ObjectId, changePasswordData: ChangePasswordDto) {
//     this.logger.log(`Changing password for partner: ${partnerId}`);
//     const { oldPassword, newPassword } = changePasswordData;

//     const partner = await this.deliveryPartnerService.findById(partnerId);
//     if (!partner) {
//       this.logger.warn(`Password change failed: Partner not found - ${partnerId}`);
//       throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
//     }

//     const validPassword = await this.tokenService.compare(oldPassword, partner.password);
//     if (!validPassword) {
//       this.logger.warn(`Password change failed: Incorrect password for ${partnerId}`);
//       throw new UnauthorizedException(AUTH_CONSTANTS.MESSAGES.ERROR.INCORRECT_PASSWORD);
//     }

//     const hashedPassword = await this.tokenService.hash(newPassword);
//     partner.password = hashedPassword;
//     await partner.save();
//     this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_CHANGE_PASSWORD);
//     return {
//       message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_CHANGE_PASSWORD,
//     };
//   }

//   async verifyOtp(partnerEmail: string, otp: string) {
//     this.logger.log(`Verifying OTP for email: ${partnerEmail}`);
//     const result = await this.otpService.verify(partnerEmail, otp);
//     this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.VERIFY_OTP);
//     return result;
//   }

//   async sendOtp(partnerEmail: string) {
//     this.logger.log(`Sending OTP to email: ${partnerEmail}`);
//     await this.emailService.sendEmail(partnerEmail);
//     this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.SEND_OTP);
//   }

//   async forgetPassword(forgotPasswordData: ForgotPasswordDto) {
//     this.logger.log('Initiating forgot password process');
//     const { email } = forgotPasswordData;
//     const existingPartner = await this.deliveryPartnerService.findByEmail(email);
//     if (!existingPartner) {
//       this.logger.warn(`Forgot password failed: Partner not found - ${email}`);
//       throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
//     }

//     await this.emailService.sendEmail(email);
//     const payload = { partnerEmail: email };
//     const accessToken = await this.tokenService.sign(payload, AUTH_CONSTANTS.TOKEN.FORGOT_PASSWORD_TOKEN_EXPIRY);
//     this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.FORGOT_PASSWORD);
//     return { accessToken };
//   }

//   async updatePassword(partnerEmail: string, updatePasswordData: UpdatePasswordDto) {
//     this.logger.log(`Updating password for email: ${partnerEmail}`);
//     const { newPassword } = updatePasswordData;
//     const partner = await this.deliveryPartnerService.findByEmail(partnerEmail);
//     if (!partner) {
//       this.logger.warn(`Password update failed: Partner not found - ${partnerEmail}`);
//       throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
//     }

//     const hashedPassword = await this.tokenService.hash(newPassword);
//     partner.password = hashedPassword;
//     await partner.save();
//     this.logger.log(AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_UPDATE_PASSWORD);
//     return {
//       message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_UPDATE_PASSWORD,
//     };
//   }
// }


import { EmailService } from './../email/email.service';
import { OtpService } from './../otp/otp.service';
import { DeliveryPartnerService } from './../deliveryPartner/deliveryPartnerService';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException, Inject } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { RegisterPartnerDto } from './dtos/registerPartnerDto';
import { LoginPartnerDto } from './dtos/loginPartnerDto';
import { PartnerDocuments } from './interfaces/partnerDocuments';
import { ChangePasswordDto } from './dtos/changePasswordDto';
import { ForgotPasswordDto } from './dtos/forgotPasswordDto';
import { Types } from 'mongoose';
import { RedisService } from '../redis/redisService';
import { UpdatePasswordDto } from './dtos/updatePasswordDto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AUTH_CONSTANTS } from './authConstants';
import { Role } from 'src/common/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly deliveryPartnerService: DeliveryPartnerService,
    private readonly otpService: OtpService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async register(registerPartnerData: RegisterPartnerDto) {
    this.logger.info('Starting partner registration', {
      service: 'AuthService',
      method: 'register',
      email: registerPartnerData.email,
      mobile: registerPartnerData.mobileNumber,
    });

      const { email, mobileNumber, password, documents } = registerPartnerData;

      const existed = await this.deliveryPartnerService.verifyPartnerRegistration(email, mobileNumber);
      if (existed) {
        this.logger.warn('Registration conflict - email or mobile already exists', {
          email,
          mobileNumber,
        });
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

      await this.deliveryPartnerService.create({ 
        ...registerPartnerData, 
        password: hashedPassword, 
        documents: doc 
      });

      this.logger.info('Partner registered successfully', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_REGISTER,
        email,
      });

      return {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_REGISTER,
      };
  }

  async login(credentials: LoginPartnerDto) {
    this.logger.info('Partner login attempt', {
      service: 'AuthService',
      method: 'login',
      email: credentials.email,
    });

      const { email, password } = credentials;

      const existedPartner = await this.deliveryPartnerService.findByEmail(email);
      if (!existedPartner) {
        this.logger.warn('Login failed - partner not found', { email });
        throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
      }

      const validPassword = await this.tokenService.compare(password, existedPartner.password);
      if (!validPassword) {
        this.logger.warn('Login failed - incorrect password', { email });
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

      this.logger.info('Login successful', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_LOGIN,
        partnerId: existedPartner._id,
      });

      return {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_LOGIN,
        accessToken,
      };
  }

  async logout(partnerId: Types.ObjectId) {
    this.logger.info('Initiating logout', {
      service: 'AuthService',
      method: 'logout',
      partnerId: partnerId.toString(),
    });

      await this.redisService.deleteData(`${AUTH_CONSTANTS.REDIS.LOGIN_KEY_PREFIX}${partnerId}`);
      const partner = await this.deliveryPartnerService.findById(partnerId);
      
      if (partner) {
        partner.isActive = false;
        await partner.save();
        this.logger.info('Logout successful', {
          message: AUTH_CONSTANTS.MESSAGES.SUCCESS.LOGOUT,
          partnerId: partnerId.toString(),
        });
      } else {
        this.logger.warn('Logout failed - partner not found', {
          partnerId: partnerId.toString(),
        });
        throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
      }
  }

  async changePassword(partnerId: Types.ObjectId, changePasswordData: ChangePasswordDto) {
    this.logger.info('Changing password', {
      service: 'AuthService',
      method: 'changePassword',
      partnerId: partnerId.toString(),
    });

      const { oldPassword, newPassword } = changePasswordData;

      const partner = await this.deliveryPartnerService.findById(partnerId);
      if (!partner) {
        this.logger.warn('Password change failed - partner not found', {
          partnerId: partnerId.toString(),
        });
        throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
      }

      const validPassword = await this.tokenService.compare(oldPassword, partner.password);
      if (!validPassword) {
        this.logger.warn('Password change failed - incorrect current password', {
          partnerId: partnerId.toString(),
        });
        throw new UnauthorizedException(AUTH_CONSTANTS.MESSAGES.ERROR.INCORRECT_PASSWORD);
      }

      const hashedPassword = await this.tokenService.hash(newPassword);
      partner.password = hashedPassword;
      await partner.save();

      this.logger.info('Password changed successfully', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_CHANGE_PASSWORD,
        partnerId: partnerId.toString(),
      });

      return {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_CHANGE_PASSWORD,
      };
    
  }

  async verifyOtp(partnerEmail: string, otp: string) {
    this.logger.info('Verifying OTP', {
      service: 'AuthService',
      method: 'verifyOtp',
      email: partnerEmail,
    });

      const result = await this.otpService.verify(partnerEmail, otp);
      this.logger.info('OTP verified successfully', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.VERIFY_OTP,
        email: partnerEmail,
      });
      return result;
  }

  async sendOtp(partnerEmail: string) {
    this.logger.info('Sending OTP', {
      service: 'AuthService',
      method: 'sendOtp',
      email: partnerEmail,
    });

      await this.emailService.sendEmail(partnerEmail);
      this.logger.info('OTP sent successfully', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SEND_OTP,
        email: partnerEmail,
      });
  }

  async forgetPassword(forgotPasswordData: ForgotPasswordDto) {
    this.logger.info('Initiating forgot password', {
      service: 'AuthService',
      method: 'forgetPassword',
      email: forgotPasswordData.email,
    });

      const { email } = forgotPasswordData;
      const existingPartner = await this.deliveryPartnerService.findByEmail(email);
      
      if (!existingPartner) {
        this.logger.warn('Forgot password failed - partner not found', { email });
        throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
      }

      await this.emailService.sendEmail(email);
      const payload = { partnerEmail: email };
      const accessToken = await this.tokenService.sign(payload, AUTH_CONSTANTS.TOKEN.FORGOT_PASSWORD_TOKEN_EXPIRY);

      this.logger.info('Forgot password processed successfully', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.FORGOT_PASSWORD,
        email,
      });

      return { success: true, accessToken };
  }

  async updatePassword(partnerEmail: string, updatePasswordData: UpdatePasswordDto) {
    this.logger.info('Updating password', {
      service: 'AuthService',
      method: 'updatePassword',
      email: partnerEmail,
    });

      const { newPassword } = updatePasswordData;
      const partner = await this.deliveryPartnerService.findByEmail(partnerEmail);
      
      if (!partner) {
        this.logger.warn('Password update failed - partner not found', { email: partnerEmail });
        throw new NotFoundException(AUTH_CONSTANTS.MESSAGES.ERROR.PARTNER_NOT_FOUND);
      }

      const hashedPassword = await this.tokenService.hash(newPassword);
      partner.password = hashedPassword;
      await partner.save();

      this.logger.info('Password updated successfully', {
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_UPDATE_PASSWORD,
        email: partnerEmail,
      });

      return {
        success: true,
        message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_UPDATE_PASSWORD,
      }
  }
}