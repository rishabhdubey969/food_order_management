import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  accessTokenRequest,
  AUTH_PACKAGE_NAME,
  AUTH_SERVICE_NAME,
  generateTokenData,
  GrpcAuthService,
} from './auth.interface';
import { lastValueFrom } from 'rxjs';
import * as path from 'path';

@Injectable()
export class AuthClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: AUTH_PACKAGE_NAME,
      protoPath: join(path.resolve(), 'src/grpc/proto/auth.proto'),
      url: '127.0.0.1:50051',
    },
  })
  private client: ClientGrpc;
  private grpcAuthService: GrpcAuthService;

  /**
   * Initializes the gRPC client and retrieves the authentication service.
   */
  onModuleInit() {
    this.grpcAuthService = this.client.getService(AUTH_SERVICE_NAME);
    console.log('grpc started1');
  }

  /**
   * Generates a token for user sign-up.
   * @param id - The user ID.
   * @param ip - The IP address of the user.
   * @param userAgent - The user agent string of the user's device.
   * @returns A promise that resolves to the sign-up response containing the generated token.
   */
  async getSignUpAccess(id: string, ip: string, userAgent: string) {
    const generateRequest: generateTokenData = { id, userAgent, ip };
    const SignupResponse = await lastValueFrom(this.grpcAuthService.GenerateToken(generateRequest));
    return SignupResponse;
  }

  /**
   * Validates the provided access token.
   * @param accessToken - The access token to validate.
   * @returns A promise that resolves to the validation response.
   */
  async ValidateTokenAuthService(accessToken: string) {
    const request: accessTokenRequest = { accessToken };
    const response = await lastValueFrom(this.grpcAuthService.ValidateToken(request));
    return response;
  }
}
