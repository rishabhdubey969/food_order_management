

import { ForbiddenException, Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { RedisService } from '../redis/redisService';
import { OTP_CONSTANTS } from './otpConstants';


@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly tokenService: TokenService
  ) {}

  async verify(partnerEmail: string, otp: string) {
    this.logger.log(`Attempting to verify OTP for email: ${partnerEmail}`);
    let otpDoc: string | null;

    try {
      otpDoc = await this.redisService.getData(`${OTP_CONSTANTS.REDIS.KEY_PREFIX}${partnerEmail}`);
      if (!otpDoc) {
        this.logger.warn(`OTP for email: ${partnerEmail} not found or expired`);
        throw new ForbiddenException(OTP_CONSTANTS.MESSAGES.ERROR.OTP_EXPIRED_INVALID);
      }
    } catch (err) {
        if(err instanceof ForbiddenException){
            throw err;
        }
      this.logger.error(`Error fetching OTP from Redis for email: ${partnerEmail}: ${err.message}`, err.stack);
      throw new InternalServerErrorException(OTP_CONSTANTS.MESSAGES.ERROR.OTP_RETRIEVAL_FAILED);
    }

    let isValid: boolean;
   
      isValid = await this.tokenService.compare(otp, otpDoc.toString());
      this.logger.debug(`OTP comparison result for ${partnerEmail}: ${isValid}`);
    

    let isVerified: boolean = false;
    if (isValid) {
        await this.redisService.deleteData(`${OTP_CONSTANTS.REDIS.KEY_PREFIX}${partnerEmail}`);
        this.logger.log(`${OTP_CONSTANTS.MESSAGES.SUCCESS.OTP_DELETED}: ${partnerEmail}`);
        isVerified = true;
    } else {
      this.logger.warn(`Invalid OTP provided for email: ${partnerEmail}`);
      throw new BadRequestException(OTP_CONSTANTS.MESSAGES.ERROR.OTP_INVALID);
    }

    const payload = {
      partnerEmail: partnerEmail,
      isVerified: isVerified
    };

    let accessToken: string;
    
      accessToken = await this.tokenService.sign(payload, OTP_CONSTANTS.TOKEN.EXPIRATION);
      this.logger.log(`${OTP_CONSTANTS.MESSAGES.SUCCESS.TOKEN_GENERATED}: ${partnerEmail}`);

    return {
      accessToken
    };
  }

  async generateOtp(email: string): Promise<string> {
    this.logger.log(`Attempting to generate OTP for email: ${email}`);
    let otpStr: string;
    let hashOtp: string;

    const otp = Math.floor(OTP_CONSTANTS.OTP.MIN_VALUE + Math.random() * (OTP_CONSTANTS.OTP.MAX_VALUE - OTP_CONSTANTS.OTP.MIN_VALUE + 1));
    otpStr = otp.toString();
    this.logger.debug(`Generated raw OTP for ${email}: ${otpStr}`);

    hashOtp = await this.tokenService.hash(otpStr);
    this.logger.debug(`Hashed OTP for ${email}`);

    await this.redisService.setData(`${OTP_CONSTANTS.REDIS.KEY_PREFIX}${email}`, hashOtp, OTP_CONSTANTS.REDIS.EXPIRATION_MS);
    this.logger.log(`${OTP_CONSTANTS.MESSAGES.SUCCESS.OTP_STORED}: ${email}`);

    return otpStr;
  }
}