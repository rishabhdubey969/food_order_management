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


// @Injectable()
// export class AuthService {

//     constructor(
//         private readonly tokenService: TokenService,
//         private readonly deliveryPartnerService: DeliveryPartnerService,
//         private readonly otpService: OtpService,
//         private readonly redisService: RedisService,
//         private readonly emailService: EmailService
//     ){}


//     async register(registerPartnerData: RegisterPartnerDto) {
    
//         const {email, mobileNumber, password, documents} = registerPartnerData;

//         const existed = await this.deliveryPartnerService.verifyPartnerRegistration(email, mobileNumber);
//         if(existed){
//             throw new ConflictException('Email Or Mobile is in Use!!!');
//         }

//         const hashedPassword = await this.tokenService.hash(password);
//         const hashedRc = await this.tokenService.hash(documents.rc);
//         const hashedDl = await this.tokenService.hash(documents.dl);
//         const hashedAadhaar = await this.tokenService.hash(documents.aadhaar);

//         const doc: PartnerDocuments = {
//             rc: hashedRc,
//             aadhaar: hashedAadhaar,
//             dl: hashedDl
//         };

//         try{
//             await this.deliveryPartnerService.create({...registerPartnerData, password: hashedPassword, documents: doc})
            
//             return {
//                 message: "Registration Successfull"
//             }
//         }catch(err){
//             throw new MongooseError(err.Message);
//         }
//     }

//     async login(credentials: LoginPartnerDto){

//         const {email, password} = credentials;
        
//         const existedPartner = await this.deliveryPartnerService.findByEmail(email);

//         if(!existedPartner){
//             throw new NotFoundException("Partner Not Found!!");
//         }

//         const validPassword = await this.tokenService.compare(password, existedPartner.password);

//         if(!validPassword){
//             throw new UnauthorizedException("Incorrect Password!!");
//         }

//         existedPartner.isActive = true;
//         await existedPartner.save();

//         const payload = {
//             partnerId: existedPartner._id,
//             role: Role.DELIVERY_PARTNER
//         }

//         const accessToken = await this.tokenService.sign(payload);
//         await this.redisService.setData(`login-${existedPartner._id}`, accessToken, 60 * 60 * 1000);

//         return {
//             messsage: "Login Successfull!!",
//             accessToken
//         }
//     }

//     async logout(partnerId: Types.ObjectId){
//         await this.redisService.deleteData(`login-${partnerId}`);
//         const partner = await this.deliveryPartnerService.findById(partnerId);
//         if(partner){
//             partner.isActive = false;
//             await partner.save();
//         }
//     }

//     async changePassword(partnerId: Types.ObjectId, changePassowrdData: ChangePasswordDto){

//         const { oldPassword, newPassword } = changePassowrdData;
//         const partner = await this.deliveryPartnerService.findById(partnerId);

//         if(!partner){
//             throw new NotFoundException("User Not Found!!");
//         }

//         const currentPassword = partner.password;

//         const validPassword = await this.tokenService.compare(oldPassword, currentPassword);

//         if(!validPassword){
//             throw new UnauthorizedException("Incorrect Password!!");
//         }
//         // 2 Step Verification can be Done

//         const hashedPassword = await this.tokenService.hash(newPassword);
//         partner.password = hashedPassword;
//         await partner.save();

//         return {
//             message: "Password Changed Successfuly!!"
//         }
//     }


//     async verifyOtp(partnerEmail: string, otp: string){
//         return this.otpService.verify(partnerEmail, otp);
//     }

//     async sendOtp(partnerEmail: string){
//         await this.emailService.sendEmail(partnerEmail);
//     }

//     async forgetPassword(forgotPasswordData: ForgotPasswordDto){
        
//         const { email } = forgotPasswordData;
//         const existingPartner = await this.deliveryPartnerService.findByEmail(email);

//         if(!existingPartner){
//             throw new NotFoundException("User Not Found!!");
//         }

//         await this.emailService.sendEmail(email);

//         const payload = {
//             partnerEmail : email
//         }

//         const accessToken = await this.tokenService.sign(payload, '5m');

//         return {
//             accessToken
//         }
//     }

//     async updatePassword(partnerEmail: string, updatePasswordData: UpdatePasswordDto){
//         const partner =  await this.deliveryPartnerService.findByEmail(partnerEmail);
//         if(!partner){
//             throw new NotFoundException("Partner Not Found!!");
//         }

//         const { newPassword } = updatePasswordData;

//         const hashedPassword = await this.tokenService.hash(newPassword);
//         partner.password = hashedPassword;
//         await partner.save();

//         return {
//             message: "Password Resets Successfully !!!"
//         }
//     }
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
import { MongooseError, Types } from 'mongoose';
import { RedisService } from '../redis/redisService';
import { UpdatePasswordDto } from './dtos/updatePasswordDto';
import { Role } from 'src/common/enums';
import { Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

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

  @ApiOperation({ summary: 'Register a new delivery partner' })
  @ApiResponse({ status: 201, description: 'Partner registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or mobile already in use' })
  async register(registerPartnerData: RegisterPartnerDto) {
    this.logger.log('Registering new delivery partner');
    const { email, mobileNumber, password, documents } = registerPartnerData;

    try {
      const existed = await this.deliveryPartnerService.verifyPartnerRegistration(email, mobileNumber);
      if (existed) {
        this.logger.warn(`Registration failed: Email or mobile already in use - ${email}`);
        throw new ConflictException('Email Or Mobile is in Use!!!');
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
      this.logger.log('Partner registered successfully');
      return {
        message: 'Registration Successful',
      };
    } catch (err) {
      this.logger.error('Error registering partner', err);
      throw new MongooseError(err.Message);
    }
  }

  @ApiOperation({ summary: 'Login a delivery partner' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async login(credentials: LoginPartnerDto) {
    this.logger.log('Attempting partner login');
    const { email, password } = credentials;

    try {
      const existedPartner = await this.deliveryPartnerService.findByEmail(email);
      if (!existedPartner) {
        this.logger.warn(`Login failed: Partner not found - ${email}`);
        throw new NotFoundException('Partner Not Found!!');
      }

      const validPassword = await this.tokenService.compare(password, existedPartner.password);
      if (!validPassword) {
        this.logger.warn(`Login failed: Incorrect password for ${email}`);
        throw new UnauthorizedException('Incorrect Password!!');
      }

      existedPartner.isActive = true;
      await existedPartner.save();

      const payload = {
        partnerId: existedPartner._id,
        role: Role.DELIVERY_PARTNER,
      };

      const accessToken = await this.tokenService.sign(payload);
      await this.redisService.setData(`login-${existedPartner._id}`, accessToken, 60 * 60 * 1000);
      this.logger.log(`Partner logged in successfully: ${email}`);
      return {
        message: 'Login Successful!!',
        accessToken,
      };
    } catch (err) {
      this.logger.error('Error logging in partner', err);
      throw new MongooseError(err.Message);
    }
  }

  @ApiOperation({ summary: 'Logout a delivery partner' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async logout(partnerId: Types.ObjectId) {
    this.logger.log(`Logging out partner: ${partnerId}`);
    try {
      await this.redisService.deleteData(`login-${partnerId}`);
      const partner = await this.deliveryPartnerService.findById(partnerId);
      if (partner) {
        partner.isActive = false;
        await partner.save();
        this.logger.log(`Partner logged out successfully: ${partnerId}`);
      } else {
        this.logger.warn(`Logout failed: Partner not found - ${partnerId}`);
        throw new NotFoundException('Partner Not Found!!');
      }
    } catch (err) {
      this.logger.error('Error logging out partner', err);
      throw new MongooseError(err.Message);
    }
  }

  @ApiOperation({ summary: 'Change password for a delivery partner' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Incorrect password' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async changePassword(partnerId: Types.ObjectId, changePasswordData: ChangePasswordDto) {
    this.logger.log(`Changing password for partner: ${partnerId}`);
    const { oldPassword, newPassword } = changePasswordData;

    try {
      const partner = await this.deliveryPartnerService.findById(partnerId);
      if (!partner) {
        this.logger.warn(`Password change failed: Partner not found - ${partnerId}`);
        throw new NotFoundException('User Not Found!!');
      }

      const validPassword = await this.tokenService.compare(oldPassword, partner.password);
      if (!validPassword) {
        this.logger.warn(`Password change failed: Incorrect password for ${partnerId}`);
        throw new UnauthorizedException('Incorrect Password!!');
      }

      const hashedPassword = await this.tokenService.hash(newPassword);
      partner.password = hashedPassword;
      await partner.save();
      this.logger.log(`Password changed successfully for ${partnerId}`);
      return {
        message: 'Password Changed Successfully!!',
      };
    } catch (err) {
      this.logger.error('Error changing password', err);
      throw new MongooseError(err.Message);
    }
  }

  @ApiOperation({ summary: 'Verify OTP for forgot password' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async verifyOtp(partnerEmail: string, otp: string) {
    this.logger.log(`Verifying OTP for email: ${partnerEmail}`);
    try {
      const result = await this.otpService.verify(partnerEmail, otp);
      this.logger.log(`OTP verified successfully for ${partnerEmail}`);
      return result;
    } catch (err) {
      this.logger.error('Error verifying OTP', err);
      throw new MongooseError(err.Message);
    }
  }

  @ApiOperation({ summary: 'Send OTP for forgot password' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(partnerEmail: string) {
    this.logger.log(`Sending OTP to email: ${partnerEmail}`);
    try {
      await this.emailService.sendEmail(partnerEmail);
      this.logger.log(`OTP sent successfully to ${partnerEmail}`);
    } catch (err) {
      this.logger.error('Error sending OTP', err);
      throw new MongooseError(err.Message);
    }
  }

  @ApiOperation({ summary: 'Initiate forgot password process' })
  @ApiResponse({ status: 200, description: 'OTP sent and token returned' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async forgetPassword(forgotPasswordData: ForgotPasswordDto) {
    this.logger.log('Initiating forgot password process');
    const { email } = forgotPasswordData;

    try {
      const existingPartner = await this.deliveryPartnerService.findByEmail(email);
      if (!existingPartner) {
        this.logger.warn(`Forgot password failed: Partner not found - ${email}`);
        throw new NotFoundException('User Not Found!!');
      }

      await this.emailService.sendEmail(email);
      const payload = { partnerEmail: email };
      const accessToken = await this.tokenService.sign(payload, '5m');
      this.logger.log(`Forgot password OTP sent for ${email}`);
      return { accessToken };
    } catch (err) {
      this.logger.error('Error in forgot password process', err);
      throw new MongooseError(err.Message);
    }
  }

  @ApiOperation({ summary: 'Update password after OTP verification' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async updatePassword(partnerEmail: string, updatePasswordData: UpdatePasswordDto) {
    this.logger.log(`Updating password for email: ${partnerEmail}`);
    const { newPassword } = updatePasswordData;

    try {
      const partner = await this.deliveryPartnerService.findByEmail(partnerEmail);
      if (!partner) {
        this.logger.warn(`Password update failed: Partner not found - ${partnerEmail}`);
        throw new NotFoundException('Partner Not Found!!');
      }

      const hashedPassword = await this.tokenService.hash(newPassword);
      partner.password = hashedPassword;
      await partner.save();
      this.logger.log(`Password reset successfully for ${partnerEmail}`);
      return {
        message: 'Password Resets Successfully!!!',
      };
    } catch (err) {
      this.logger.error('Error updating password', err);
      throw new MongooseError(err.Message);
    }
  }
}