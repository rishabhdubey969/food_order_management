

// import { Injectable, Logger, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'; // Import Logger and relevant exceptions
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcrypt';

// @Injectable()
// export class TokenService {
//     private readonly logger = new Logger(TokenService.name);

//     constructor(private readonly jwtService: JwtService) {}

//     async hash(data: string): Promise<string> {
//         this.logger.log('Attempting to hash data.');
//         try {
//             const salt = await bcrypt.genSalt(10);
//             const hashedPassword = await bcrypt.hash(data, salt);
//             this.logger.log('Data successfully hashed.');
//             return hashedPassword;
//         } catch (error) {
//             this.logger.error(`Error hashing data: ${error.message}`, error.stack);
//             throw new InternalServerErrorException('Failed to hash data.');
//         }
//     }

//     async compare(data1: string, data2: string): Promise<boolean> {
//         this.logger.log('Attempting to compare data.');
//         try {
//             const isMatch = await bcrypt.compare(data1, data2);
//             this.logger.log(`Data comparison result: ${isMatch}.`);
//             return isMatch;
//         } catch (error) {
//             this.logger.error(`Error comparing data: ${error.message}`, error.stack);
//             throw new InternalServerErrorException('Failed to compare data.');
//         }
//     }

//     async sign(payload: any, expiresIn?: string): Promise<string> {
//         this.logger.log(`Attempting to sign JWT with payload: ${JSON.stringify(payload)} and expiresIn: ${expiresIn || 'none'}.`);
//         try {
//             const signOptions: { expiresIn?: string } = {};
//             if (expiresIn) {
//                 signOptions.expiresIn = expiresIn;
//             }
//             const token = await this.jwtService.sign(payload, signOptions);
//             this.logger.log('JWT successfully signed.');
//             return token;
//         } catch (error) {
//             this.logger.error(`Error signing JWT: ${error.message}`, error.stack);
//             throw new InternalServerErrorException('Failed to sign JWT.');
//         }
//     }

//     async verify(accessToken: string): Promise<any> {
//         this.logger.log('Attempting to verify JWT.');
//         try {
//             const decoded = await this.jwtService.verify(accessToken);
//             this.logger.log('JWT successfully verified.');
//             return decoded;
//         } catch (error) {
//             this.logger.error(`Error verifying JWT: ${error.message}`, error.stack);
            
//             if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
//                 throw new UnauthorizedException('Invalid or expired token.');
//             }
//             throw new InternalServerErrorException('Failed to verify token.');
//         }
//     }
// }


import { Injectable, Logger, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TOKEN_CONSTANTS } from './tokenConstant';


@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly jwtService: JwtService) {}

  async hash(data: string): Promise<string> {
    this.logger.log('Attempting to hash data');
    try {
      const salt = await bcrypt.genSalt(TOKEN_CONSTANTS.BCRYPT.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(data, salt);
      this.logger.log(TOKEN_CONSTANTS.MESSAGES.SUCCESS.HASHED);
      return hashedPassword;
    } catch (error) {
      this.logger.error(`Error hashing data: ${error.message}`, error.stack);
      throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.HASH_FAILED);
    }
  }

  async compare(data1: string, data2: string): Promise<boolean> {
    this.logger.log('Attempting to compare data');
    try {
      const isMatch = await bcrypt.compare(data1, data2);
      this.logger.log(`${TOKEN_CONSTANTS.MESSAGES.SUCCESS.COMPARED}: ${isMatch}`);
      return isMatch;
    } catch (error) {
      this.logger.error(`Error comparing data: ${error.message}`, error.stack);
      throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.COMPARE_FAILED);
    }
  }

  async sign(payload: any, expiresIn?: string): Promise<string> {
    this.logger.log(`Attempting to sign JWT with payload: ${JSON.stringify(payload)} and expiresIn: ${expiresIn || 'none'}`);
    try {
      const signOptions: { expiresIn?: string } = {};
      if (expiresIn) {
        signOptions.expiresIn = expiresIn;
      }
      const token = await this.jwtService.sign(payload, signOptions);
      this.logger.log(TOKEN_CONSTANTS.MESSAGES.SUCCESS.JWT_SIGNED);
      return token;
    } catch (error) {
      this.logger.error(`Error signing JWT: ${error.message}`, error.stack);
      throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.JWT_SIGN_FAILED);
    }
  }

  async verify(accessToken: string): Promise<any> {
    this.logger.log('Attempting to verify JWT');
    try {
      const decoded = await this.jwtService.verify(accessToken);
      this.logger.log(TOKEN_CONSTANTS.MESSAGES.SUCCESS.JWT_VERIFIED);
      return decoded;
    } catch (error) {
      this.logger.error(`Error verifying JWT: ${error.message}`);
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(TOKEN_CONSTANTS.MESSAGES.ERROR.INVALID_EXPIRED_TOKEN);
      }
      throw new InternalServerErrorException(TOKEN_CONSTANTS.MESSAGES.ERROR.JWT_VERIFY_FAILED);
    }
  }
}