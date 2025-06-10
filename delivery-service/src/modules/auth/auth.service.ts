import { Message } from './../../../node_modules/@nestjs/microservices/external/kafka.interface.d';
import { OtpService } from './../otp/otp.service';
import { DeliveryPartnerService } from './../deliveryPartner/deliveryPartnerService';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { RegisterPartnerDto } from './dtos/registerPartnerDto';
import { LoginPartnerDto } from './dtos/loginPartnerDto';
import { PartnerDocuments } from './interfaces/partnerDocuments';
import { AccessRole, Role } from 'src/common/enums';
import { ChangePasswordDto } from './dtos/changePasswordDto';
import { ForgotPasswordDto } from './dtos/forgotPasswordDto';
import { MongooseError } from 'mongoose';

@Injectable()
export class AuthService {

    constructor(
        private readonly tokenService: TokenService,
        private readonly deliveryPartnerService: DeliveryPartnerService,
        private readonly otpService: OtpService
    ){}


    async register(registerPartnerData: RegisterPartnerDto) {
    
        const {email, mobileNumber, password, documents} = registerPartnerData;

        const existed = await this.deliveryPartnerService.verifyPartnerRegistration(email, mobileNumber);
        if(existed){
            throw new ConflictException('Email Or Mobile is in Use!!!');
        }

        const hashedPassword = await this.tokenService.hash(password);
        const hashedRc = await this.tokenService.hash(documents.rc);
        const hashedDl = await this.tokenService.hash(documents.dl);
        const hashedAadhaar = await this.tokenService.hash(documents.aadhaar);

        const doc: PartnerDocuments = {
            rc: hashedRc,
            aadhaar: hashedAadhaar,
            dl: hashedDl
        };

        try{
            await this.deliveryPartnerService.create({...registerPartnerData, password: hashedPassword, documents: doc})
            
            return {
                message: "Registration Successfull"
            }
        }catch(err){
            throw new MongooseError(err.Message);
        }
    }

    async login(credentials: LoginPartnerDto){

        const {email, password} = credentials;
        
        const existedUser = await this.deliveryPartnerService.findByEmail(email);

        if(!existedUser){
            throw new NotFoundException("User Not Found!!");
        }

        const validPassword = await this.tokenService.compare(password, existedUser.password);

        if(!validPassword){
            throw new UnauthorizedException("Incorrect Password!!");
        }

        const payload = {
            userId: existedUser._id,
            role: Role.DELIVERY_PARTNER,
            accessRole: AccessRole.AUTH
        }

        const accessToken = await this.tokenService.sign(payload);

        return {
            messsage: "Login Successfull!!",
            accessToken
        }
    }

    async changePassword(userId: string, changePassowrdData: ChangePasswordDto){

        const { oldPassword, newPassword } = changePassowrdData;
        const user = await this.deliveryPartnerService.findById(userId);

        if(!user){
            throw new NotFoundException("User Not Found!!");
        }

        const password = user.password;

        const validPassword = await this.tokenService.compare(oldPassword, password);

        if(!validPassword){
            throw new UnauthorizedException("Incorrect Password!!");
        }

        const hashedPassword = await this.tokenService.hash(newPassword);
        user.password = hashedPassword;
        await user.save();

        return {
            message: "Password Changed Successfuly!!"
        }
    }


    async verifyOtp(userEmail: string, otp: string){
        return this.otpService.verify(userEmail, otp);
    }

    async sendOtp(email: string){
        const otp = await this.otpService.generateOtp(email);
        // await this.notificationService.sendEmail(email, otp);
    }

    async forgetPassword(forgotPasswordData: ForgotPasswordDto){
        
        const { email } = forgotPasswordData;
        const existingUser = await this.deliveryPartnerService.findByEmail(email);

        if(!existingUser){
            throw new NotFoundException("User Not Found!!");
        }

        // await this.sendOtp(email);

        const payload = {
            userEmail : email,
            accessRole: AccessRole.FORGET_PASSWORD
        }

        const accessToken = await this.tokenService.sign(payload, '5m');

        return {
            accessToken
        }
    }
}
