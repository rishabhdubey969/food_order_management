import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  PresignRequest,
  PresignResponse,
  ConfirmRequest,
  ConfirmResponse,
  MEDIA_PACKAGE_NAME,
  MEDIA_SERVICE_NAME,
  GrpcMediaService,
} from '../media/media.interface';
import { lastValueFrom } from 'rxjs';
import * as path from 'path';

@Injectable()
export class MediaClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: MEDIA_PACKAGE_NAME,
      protoPath: join(path.resolve(), 'src/grpc/proto/media.proto'),
      url: '127.0.0.1:50052',
    },
  })
  private client: ClientGrpc;
  private grpcMediaService: GrpcMediaService;

  onModuleInit() {
    this.grpcMediaService = this.client.getService(MEDIA_SERVICE_NAME);
    console.log('grpc started 1');
  }

  async GeneratePresignedUrlClient(service: string, resourceType: string, resourceId: string, fileExtension: string, contentType: string) {
    const generateRequest: PresignRequest = { service, resourceType, resourceId, fileExtension, contentType };
    const presignUrlResponse = await lastValueFrom(this.grpcMediaService.GeneratePresignedUrl(generateRequest));
    console.log(presignUrlResponse);
    return presignUrlResponse;
  }

  async ConfirmUploadClient(key: string, service: string, resourceId: string) {
    const request: ConfirmRequest = { key, service, resourceId };
    const response = await lastValueFrom(this.grpcMediaService.ConfirmUpload(request));
    console.log(response, 'new');
    return response;
  }
}
