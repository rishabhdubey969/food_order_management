
import { ForbiddenException, Injectable } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { RedisService } from '../redis/redisService';

@Injectable()
export class OtpService {

    constructor(
        private readonly redisService: RedisService,
        private readonly tokenService: TokenService
    ){}

    async verify(email: string, otp: string){

        const otpDoc = await this.redisService.getData(`otp-${email}`)

        if(!otpDoc)   
            throw new ForbiddenException("OTP Expired!!");

        const isValid = await this.tokenService.compare(otp, otpDoc.toString());

        if(isValid){
            await this.redisService.deleteData(`otp-${email}`);
            return true;
        }
        return false;
    }


    async generateOtp(email: string){
        const otp = Math.floor(99999 + Math.random() * 100000)
        const otpStr = otp.toString();
        const hashOtp = await this.tokenService.hash(otpStr);
        await this.redisService.setData(`otp-${email}`, hashOtp, 5 * 60 * 1000);
        return otpStr;
    }
}
