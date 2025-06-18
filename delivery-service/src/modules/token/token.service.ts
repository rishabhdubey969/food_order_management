

// import { Injectable, Logger, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcrypt';
// import { TOKEN_CONSTANTS } from './tokenConstant';


// @Injectable()
// export class TokenService {
//   private readonly logger = new Logger(TokenService.name);

//   constructor(private readonly jwtService: JwtService) {}

//   async hash(data: string): Promise<string> {
//     this.logger.log('Attempting to hash data');
//     try {
//       const salt = await bcrypt.genSalt(TOKEN_CONSTANTS.BCRYPT.SALT_ROUNDS);
//       const hashedPassword = await bcrypt.hash(data, salt);
//       this.logger.log(TOKEN_CONSTANTS.MESSAGES.SUCCESS.HASHED);
//       return hashedPassword;
//     } catch (error) {
//       this.logger.error(`Error hashing data: ${error.message}`, error.stack);
//       throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.HASH_FAILED);
//     }
//   }

//   async compare(data1: string, data2: string): Promise<boolean> {
//     this.logger.log('Attempting to compare data');
//     try {
//       const isMatch = await bcrypt.compare(data1, data2);
//       this.logger.log(`${TOKEN_CONSTANTS.MESSAGES.SUCCESS.COMPARED}: ${isMatch}`);
//       return isMatch;
//     } catch (error) {
//       this.logger.error(`Error comparing data: ${error.message}`, error.stack);
//       throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.COMPARE_FAILED);
//     }
//   }

//   async sign(payload: any, expiresIn?: string): Promise<string> {
//     this.logger.log(`Attempting to sign JWT with payload: ${JSON.stringify(payload)} and expiresIn: ${expiresIn || 'none'}`);
//     try {
//       const signOptions: { expiresIn?: string } = {};
//       if (expiresIn) {
//         signOptions.expiresIn = expiresIn;
//       }
//       const token = await this.jwtService.sign(payload, signOptions);
//       this.logger.log(TOKEN_CONSTANTS.MESSAGES.SUCCESS.JWT_SIGNED);
//       return token;
//     } catch (error) {
//       this.logger.error(`Error signing JWT: ${error.message}`, error.stack);
//       throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.JWT_SIGN_FAILED);
//     }
//   }

//   async verify(accessToken: string): Promise<any> {
//     this.logger.log('Attempting to verify JWT');
//     try {
//       const decoded = await this.jwtService.verify(accessToken);
//       this.logger.log(TOKEN_CONSTANTS.MESSAGES.SUCCESS.JWT_VERIFIED);
//       return decoded;
//     } catch (error) {
//       this.logger.error(`Error verifying JWT: ${error.message}`);
//       if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
//         throw new UnauthorizedException(TOKEN_CONSTANTS.MESSAGES.ERROR.INVALID_EXPIRED_TOKEN);
//       }
//       throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.JWT_VERIFY_FAILED);
//     }
//   }
// }


import { Injectable, InternalServerErrorException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TOKEN_CONSTANTS } from './tokenConstant';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  async hash(data: string): Promise<string> {
    this.logger.info('Hashing data', {
      service: 'TokenService',
      method: 'hash'
    });

    try {
      const salt = await bcrypt.genSalt(TOKEN_CONSTANTS.BCRYPT.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(data, salt);
      
      this.logger.info('Data hashed successfully', {
        service: 'TokenService',
        method: 'hash',
        message: TOKEN_CONSTANTS.MESSAGES.SUCCESS.HASHED
      });
      
      return hashedPassword;
    } catch (error) {
      this.logger.error('Failed to hash data', {
        service: 'TokenService',
        method: 'hash',
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.HASH_FAILED);
    }
  }

  async compare(data1: string, data2: string): Promise<boolean> {
    this.logger.info('Comparing data', {
      service: 'TokenService',
      method: 'compare'
    });

    try {
      const isMatch = await bcrypt.compare(data1, data2);
      
      this.logger.info('Data comparison completed', {
        service: 'TokenService',
        method: 'compare',
        isMatch,
        message: TOKEN_CONSTANTS.MESSAGES.SUCCESS.COMPARED
      });
      
      return isMatch;
    } catch (error) {
      this.logger.error('Failed to compare data', {
        service: 'TokenService',
        method: 'compare',
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.COMPARE_FAILED);
    }
  }

  async sign(payload: any, expiresIn?: string): Promise<string> {
    this.logger.info('Signing JWT', {
      service: 'TokenService',
      method: 'sign',
      payloadType: typeof payload,
      expiresIn: expiresIn || 'default'
    });

    try {
      const signOptions: { expiresIn?: string } = {};
      if (expiresIn) {
        signOptions.expiresIn = expiresIn;
      }
      
      const token = await this.jwtService.sign(payload, signOptions);
      
      this.logger.info('JWT signed successfully', {
        service: 'TokenService',
        method: 'sign',
        message: TOKEN_CONSTANTS.MESSAGES.SUCCESS.JWT_SIGNED
      });
      
      return token;
    } catch (error) {
      this.logger.error('Failed to sign JWT', {
        service: 'TokenService',
        method: 'sign',
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.JWT_SIGN_FAILED);
    }
  }

  async verify(accessToken: string): Promise<any> {
    this.logger.info('Verifying JWT', {
      service: 'TokenService',
      method: 'verify'
    });

    try {
      const decoded = await this.jwtService.verify(accessToken);
      
      this.logger.info('JWT verified successfully', {
        service: 'TokenService',
        method: 'verify',
        message: TOKEN_CONSTANTS.MESSAGES.SUCCESS.JWT_VERIFIED
      });
      
      return decoded;
    } catch (error) {
      this.logger.error('Failed to verify JWT', {
        service: 'TokenService',
        method: 'verify',
        error: error.message,
        errorName: error.name,
        stack: error.stack
      });

      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(TOKEN_CONSTANTS.MESSAGES.ERROR.INVALID_EXPIRED_TOKEN);
      }
      
      throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.JWT_VERIFY_FAILED);
    }
  }
}