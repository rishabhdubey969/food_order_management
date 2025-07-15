
import { Injectable, InternalServerErrorException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TOKEN_CONSTANTS } from './tokenConstant';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class TokenService {
  /**
   * Initializes the TokenService with JWT and logging dependencies.
   *
   * Args:
   *   jwtService (JwtService): Service for handling JWT operations.
   *   logger (Logger): Winston logger for logging service events.
   */
  constructor(
    private readonly jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  async hash(data: string): Promise<string> {
    /**
     * Hashes a string using bcrypt with a generated salt.
     *
     * Args:
     *   data (string): The data to hash.
     *
     * Returns:
     *   Promise<string>: The hashed data.
     *
     * Throws:
     *   InternalServerErrorException: If hashing the data fails.
     */
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
    /**
     * Compares a plain string with a hashed string using bcrypt.
     *
     * Args:
     *   data1 (string): The plain string to compare.
     *   data2 (string): The hashed string to compare against.
     *
     * Returns:
     *   Promise<boolean>: True if the strings match, false otherwise.
     *
     * Throws:
     *   InternalServerErrorException: If the comparison fails.
     */
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
    /**
     * Signs a payload to create a JWT with optional expiration.
     *
     * Args:
     *   payload (any): The data to include in the JWT.
     *   expiresIn (string, optional): The expiration time for the token (e.g., '1h', '7d').
     *
     * Returns:
     *   Promise<string>: The generated JWT.
     *
     * Throws:
     *   InternalServerErrorException: If signing the JWT fails.
     */
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
    /**
     * Verifies a JWT and returns its decoded payload.
     *
     * Args:
     *   accessToken (string): The JWT to verify.
     *
     * Returns:
     *   Promise<any>: The decoded payload of the JWT.
     *
     * Throws:
     *   UnauthorizedException: If the token is expired or invalid.
     *   InternalServerErrorException: If verifying the token fails for other reasons.
     */
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