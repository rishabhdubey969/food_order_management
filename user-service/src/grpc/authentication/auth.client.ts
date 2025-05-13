import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AUTH_PACKAGE_NAME, AUTH_SERVICE_NAME, GrpcAuthService } from './auth.interface';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import * as path from 'path';

@Injectable()
export class AuthClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: AUTH_PACKAGE_NAME,
      protoPath: join(path.resolve(), 'src/grpc/proto/auth.proto'),
      url: '127.0.0.1:5003',
    },
  })
  private client: ClientGrpc;
  private grpcAuthService: GrpcAuthService;
  
  onModuleInit() {
    this.grpcAuthService = this.client.getService(AUTH_SERVICE_NAME);
    console.log("grpc started");
  }

  async getLoginAccess(accessToken: string) {
    console.log({accessToken});
    const response  = await lastValueFrom(this.grpcAuthService.ValidateToken({ accessToken }));
    console.log(response);
    return response;
  }
  
  }
