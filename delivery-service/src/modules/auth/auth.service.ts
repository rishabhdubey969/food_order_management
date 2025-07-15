
import { EmailService } from './../email/email.service';
import { OtpService } from './../otp/otp.service';
import { DeliveryPartnerService } from './../deliveryPartner/deliveryPartnerService';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException, Inject, BadRequestException } from '@nestjs/common';
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
import { DeliveryPartnerStatus } from '../deliveryPartner/enums/partnerEnum';

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

  async handleRegisterEmail(partnerEmail: string) {
    /**
     * Handles email registration by checking for existing emails and sending an OTP.
     *
     * Args:
     *   partnerEmail (string): The email address of the partner attempting to register.
     *
     * Returns:
     *   Promise<{ success: boolean, accessToken: string, message: string }>: A success response with an access token and confirmation message.
     *
     * Throws:
     *   BadRequestException: If the email already exists in the system.
     */
    const isExisted = await this.deliveryPartnerService.findByEmail(partnerEmail);

    if (isExisted) {
      throw new BadRequestException('Email Already Exist!!');
    }

    await this.emailService.sendEmail(partnerEmail);
    const payload = { partnerEmail: partnerEmail };
    const accessToken = await this.tokenService.sign(payload, AUTH_CONSTANTS.TOKEN.FORGOT_PASSWORD_TOKEN_EXPIRY);

    return {
      success: true,
      accessToken,
      message: 'Otp Sent Successfully!!',
    };
  }

  async register(registerPartnerData: RegisterPartnerDto, partnerEmail: string) {
    /**
     * Registers a new delivery partner with hashed password and documents.
     *
     * Args:
     *   registerPartnerData (RegisterPartnerDto): The data transfer object containing partner registration details.
     *   partnerEmail (string): The email address of the partner, verified via OTP.
     *
     * Returns:
     *   Promise<{ success: boolean, message: string }>: A success response with a confirmation message.
     *
     * Throws:
     *   ConflictException: If the email or mobile number is already in use.
     */
    this.logger.info('Starting partner registration', {
      service: 'AuthService',
      method: 'register',
      email: partnerEmail,
      mobile: registerPartnerData.mobileNumber,
    });

    const { mobileNumber, password, documents } = registerPartnerData;

    const existed = await this.deliveryPartnerService.verifyPartnerRegistration(partnerEmail, mobileNumber);
    if (existed) {
      this.logger.warn('Registration conflict - email or mobile already exists', {
        partnerEmail,
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

    await this.deliveryPartnerService.create(
      {
        ...registerPartnerData,
        password: hashedPassword,
        documents: doc,
      },
      partnerEmail,
    );

    this.logger.info('Partner registered successfully', {
      message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_REGISTER,
      partnerEmail,
    });

    return {
      success: true,
      message: AUTH_CONSTANTS.MESSAGES.SUCCESS.SERVICE_REGISTER,
    };
  }

  async login(credentials: LoginPartnerDto) {
    /**
     * Authenticates a delivery partner and generates an access token.
     *
     * Args:
     *   credentials (LoginPartnerDto): The data transfer object containing email and password.
     *
     * Returns:
     *   Promise<{ success: boolean, message: string, accessToken: string }>: A success response with an access token.
     *
     * Throws:
     *   NotFoundException: If the partner is not found.
     *   UnauthorizedException: If the password is incorrect.
     */
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
      role: Role.DELIVERY_PARTNER,
    };

    const accessToken = await this.tokenService.sign(payload);

    await this.redisService.setData(
      `${AUTH_CONSTANTS.REDIS.LOGIN_KEY_PREFIX}${existedPartner._id}`,
      accessToken,
      AUTH_CONSTANTS.REDIS.LOGIN_TOKEN_TTL,
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
    /**
     * Logs out a delivery partner by invalidating their session and setting their status to inactive.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the partner.
     *
     * Returns:
     *   Promise<void>: No return value; completes the logout process.
     *
     * Throws:
     *   NotFoundException: If the partner is not found.
     */
    this.logger.info('Initiating logout', {
      service: 'AuthService',
      method: 'logout',
      partnerId: partnerId.toString(),
    });

    await this.redisService.deleteData(`${AUTH_CONSTANTS.REDIS.LOGIN_KEY_PREFIX}${partnerId}`);
    const partner = await this.deliveryPartnerService.findById(partnerId);

    if (partner) {
      partner.isActive = false;
      partner.status = DeliveryPartnerStatus.OFFLINE
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
    /**
     * Changes the password for a delivery partner after verifying the old password.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the partner.
     *   changePasswordData (ChangePasswordDto): The data transfer object containing old and new passwords.
     *
     * Returns:
     *   Promise<{ message: string }>: A success response with a confirmation message.
     *
     * Throws:
     *   NotFoundException: If the partner is not found.
     *   UnauthorizedException: If the old password is incorrect.
     */
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
    /**
     * Verifies the OTP for a partner during password reset.
     *
     * Args:
     *   partnerEmail (string): The email address of the partner.
     *   otp (string): The OTP code provided by the partner.
     *
     * Returns:
     *   Promise<any>: The result of the OTP verification process.
     */
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
    /**
     * Sends an OTP to the partner's email for password reset or registration.
     *
     * Args:
     *   partnerEmail (string): The email address of the partner.
     *
     * Returns:
     *   Promise<void>: No return value; completes the OTP sending process.
     */
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
    /**
     * Initiates the forgot password process by sending a reset OTP to the partner's email.
     *
     * Args:
     *   forgotPasswordData (ForgotPasswordDto): The data transfer object containing the partner's email.
     *
     * Returns:
     *   Promise<{ success: boolean, accessToken: string }>: A success response with an access token.
     *
     * Throws:
     *   NotFoundException: If the partner is not found.
     */
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
    /**
     * Updates the partner's password after OTP verification.
     *
     * Args:
     *   partnerEmail (string): The email address of the partner.
     *   updatePasswordData (UpdatePasswordDto): The data transfer object containing the new password.
     *
     * Returns:
     *   Promise<{ success: boolean, message: string }>: A success response with a confirmation message.
     *
     * Throws:
     *   NotFoundException: If the partner is not found.
     */
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
    };
  }
}