
import { ForbiddenException, Injectable, InternalServerErrorException, BadRequestException, Inject } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { RedisService } from '../redis/redisService';
import { OTP_CONSTANTS } from './otpConstants';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly tokenService: TokenService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  async verify(partnerEmail: string, otp: string) {
    this.logger.info('Verifying OTP', {
      service: 'OtpService',
      method: 'verify',
      email: partnerEmail
    });

    let otpDoc: string | null;
    try {
      otpDoc = await this.redisService.getData(`${OTP_CONSTANTS.REDIS.KEY_PREFIX}${partnerEmail}`);
      if (!otpDoc) {
        this.logger.warn('OTP not found or expired', {
          email: partnerEmail,
          error: OTP_CONSTANTS.MESSAGES.ERROR.OTP_EXPIRED_INVALID
        });
        throw new ForbiddenException(OTP_CONSTANTS.MESSAGES.ERROR.OTP_EXPIRED_INVALID);
      }
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      this.logger.error('Failed to fetch OTP from Redis', {
        service: 'OtpService',
        method: 'verify',
        email: partnerEmail,
        error: err.message,
        stack: err.stack
      });
      throw new InternalServerErrorException(OTP_CONSTANTS.MESSAGES.ERROR.OTP_RETRIEVAL_FAILED);
    }

    let isValid: boolean;
  
      isValid = await this.tokenService.compare(otp, otpDoc.toString());
      this.logger.debug('OTP comparison result', {
        service: 'OtpService',
        email: partnerEmail,
        isValid
      });

    let isVerified = false;
    if (isValid) {
  
        await this.redisService.deleteData(`${OTP_CONSTANTS.REDIS.KEY_PREFIX}${partnerEmail}`);
        this.logger.info('OTP verified and deleted', {
          service: 'OtpService',
          email: partnerEmail,
          message: OTP_CONSTANTS.MESSAGES.SUCCESS.OTP_DELETED
        });
        isVerified = true;
    } else {
      this.logger.warn('Invalid OTP provided', {
        service: 'OtpService',
        email: partnerEmail,
        error: OTP_CONSTANTS.MESSAGES.ERROR.OTP_INVALID
      });
      throw new BadRequestException(OTP_CONSTANTS.MESSAGES.ERROR.OTP_INVALID);
    }

    const payload = {
      partnerEmail: partnerEmail,
      isVerified: isVerified
    };

    let accessToken: string;
    
      accessToken = await this.tokenService.sign(payload, OTP_CONSTANTS.TOKEN.EXPIRATION);
      this.logger.info('Token generated successfully', {
        service: 'OtpService',
        email: partnerEmail,
        message: OTP_CONSTANTS.MESSAGES.SUCCESS.TOKEN_GENERATED
      });
    return { accessToken };
  }

  async generateOtp(email: string): Promise<string> {
    this.logger.info('Generating OTP', {
      service: 'OtpService',
      method: 'generateOtp',
      email
    });

    const otp = Math.floor(OTP_CONSTANTS.OTP.MIN_VALUE + Math.random() * (OTP_CONSTANTS.OTP.MAX_VALUE - OTP_CONSTANTS.OTP.MIN_VALUE + 1));
    const otpStr = otp.toString();
    
    this.logger.debug('Generated raw OTP', {
      service: 'OtpService',
      email,
      otp: otpStr
    });

    let hashOtp: string;
    
      hashOtp = await this.tokenService.hash(otpStr);
      this.logger.debug('Hashed OTP', {
        service: 'OtpService',
        email
      });

      await this.redisService.setData(
        `${OTP_CONSTANTS.REDIS.KEY_PREFIX}${email}`,
        hashOtp,
        OTP_CONSTANTS.REDIS.EXPIRATION_MS
      );
      this.logger.info('OTP stored successfully', {
        service: 'OtpService',
        email,
        message: OTP_CONSTANTS.MESSAGES.SUCCESS.OTP_STORED
      });

    return otpStr;
  }
}