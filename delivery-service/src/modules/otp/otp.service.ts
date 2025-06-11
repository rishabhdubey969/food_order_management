
import { ForbiddenException, Injectable } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { RedisService } from '../redis/redisService';

@Injectable()
export class OtpService {

    constructor(
        private readonly redisService: RedisService,
        private readonly tokenService: TokenService
    ){}

    async verify(partnerEmail: string, otp: string){

        const otpDoc = await this.redisService.getData(`otp-${partnerEmail}`)

        if(!otpDoc){
            throw new ForbiddenException("OTP Expired!!");
        }

        const isValid = await this.tokenService.compare(otp, otpDoc.toString());
        let isVerified: boolean = false;
        if(isValid){
            await this.redisService.deleteData(`otp-${partnerEmail}`);
            isVerified = true;
        }
        
        const payload = {
            partnerEmail: partnerEmail,
            isVerified: isVerified
        }

        const accessToken = await this.tokenService.sign(payload, '5m')
        return {
            accessToken
        }
    }


    async generateOtp(email: string){
        const otp = Math.floor(99999 + Math.random() * 100000)
        const otpStr = otp.toString();
        const hashOtp = await this.tokenService.hash(otpStr);
        await this.redisService.setData(`otp-${email}`, hashOtp, 5 * 60 * 1000);
        return otpStr;
    }
}
