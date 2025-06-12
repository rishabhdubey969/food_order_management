
// import { ForbiddenException, Injectable } from '@nestjs/common';
// import { TokenService } from '../token/token.service';
// import { RedisService } from '../redis/redisService';

// @Injectable()
// export class OtpService {

//     constructor(
//         private readonly redisService: RedisService,
//         private readonly tokenService: TokenService
//     ){}

//     async verify(partnerEmail: string, otp: string){

//         const otpDoc = await this.redisService.getData(`otp-${partnerEmail}`)

//         if(!otpDoc){
//             throw new ForbiddenException("OTP Expired!!");
//         }

//         const isValid = await this.tokenService.compare(otp, otpDoc.toString());
//         let isVerified: boolean = false;
//         if(isValid){
//             await this.redisService.deleteData(`otp-${partnerEmail}`);
//             isVerified = true;
//         }
        
//         const payload = {
//             partnerEmail: partnerEmail,
//             isVerified: isVerified
//         }

//         const accessToken = await this.tokenService.sign(payload, '5m')
//         return {
//             accessToken
//         }
//     }


//     async generateOtp(email: string){
//         const otp = Math.floor(99999 + Math.random() * 100000)
//         const otpStr = otp.toString();
//         const hashOtp = await this.tokenService.hash(otpStr);
//         await this.redisService.setData(`otp-${email}`, hashOtp, 5 * 60 * 1000);
//         return otpStr;
//     }
// }


import { ForbiddenException, Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common'; // Import Logger and a suitable exception
import { TokenService } from '../token/token.service';
import { RedisService } from '../redis/redisService';

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name); // Instantiate logger

    constructor(
        private readonly redisService: RedisService,
        private readonly tokenService: TokenService
    ) {}

    async verify(partnerEmail: string, otp: string) {
        this.logger.log(`Attempting to verify OTP for email: ${partnerEmail}`);
        let otpDoc: string | null;

        try {
            otpDoc = await this.redisService.getData(`otp-${partnerEmail}`);
            if (!otpDoc) {
                this.logger.warn(`OTP for email: ${partnerEmail} not found or expired.`);
                throw new ForbiddenException('OTP Expired or Invalid!');
            }
        } catch (redisError) {
            this.logger.error(`Error fetching OTP from Redis for email: ${partnerEmail}: ${redisError.message}`, redisError.stack);
            throw new InternalServerErrorException('Failed to retrieve OTP for verification.');
        }

        let isValid: boolean;
        try {
            isValid = await this.tokenService.compare(otp, otpDoc.toString());
            this.logger.debug(`OTP comparison result for ${partnerEmail}: ${isValid}`);
        } catch (compareError) {
            this.logger.error(`Error comparing OTP for email: ${partnerEmail}: ${compareError.message}`, compareError.stack);
            throw new InternalServerErrorException('Failed to verify OTP.');
        }
        
        let isVerified: boolean = false;
        if (isValid) {
            try {
                await this.redisService.deleteData(`otp-${partnerEmail}`);
                this.logger.log(`OTP for email: ${partnerEmail} successfully deleted from Redis.`);
                isVerified = true;
            } catch (deleteError) {
                this.logger.error(`Error deleting OTP from Redis for email: ${partnerEmail}: ${deleteError.message}`, deleteError.stack);
            }
        } else {
            this.logger.warn(`Invalid OTP provided for email: ${partnerEmail}.`);
            throw new BadRequestException("Invalid Otp")
        }
        
        const payload = {
            partnerEmail: partnerEmail,
            isVerified: isVerified
        };

        let accessToken: string;
        try {
            accessToken = await this.tokenService.sign(payload, '5m');
            this.logger.log(`Access token generated for email: ${partnerEmail} with verification status: ${isVerified}`);
        } catch (signError) {
            this.logger.error(`Error signing access token for email: ${partnerEmail}: ${signError.message}`, signError.stack);
            throw new InternalServerErrorException('Failed to generate access token after OTP verification.');
        }

        return {
            accessToken
        };
    }

    async generateOtp(email: string): Promise<string> {
        this.logger.log(`Attempting to generate OTP for email: ${email}`);
        let otpStr: string;
        let hashOtp: string;

       
            const otp = Math.floor(100000 + Math.random() * 900000); // Ensures a 6-digit OTP
            otpStr = otp.toString();
            this.logger.debug(`Generated raw OTP for ${email}: ${otpStr}`);
        
            hashOtp = await this.tokenService.hash(otpStr);
            this.logger.debug(`Hashed OTP for ${email}`);
       

            await this.redisService.setData(`otp-${email}`, hashOtp, 5 * 60 * 1000); // 5 minutes expiry
            this.logger.log(`OTP for email: ${email} successfully stored in Redis.`);
        
        return otpStr;
    }
}