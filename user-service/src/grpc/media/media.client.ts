import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { lastValueFrom } from 'rxjs';

import {
  PresignRequest,
  ConfirmRequest,
  ConfirmResponse,
  MEDIA_PACKAGE_NAME,
  MEDIA_SERVICE_NAME,
  GrpcMediaService,
  FileMeta,
  PresignResponse,
} from '../media/media.interface';

@Injectable()
export class MediaClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: MEDIA_PACKAGE_NAME,
      protoPath: join(process.cwd(), 'src/grpc/proto/media.proto'), // cleaner
      url: '127.0.0.1:50052',
    },
  })
  private client: ClientGrpc;

  private grpcMediaService: GrpcMediaService;

  onModuleInit() {
    this.grpcMediaService = this.client.getService<GrpcMediaService>(MEDIA_SERVICE_NAME);
    console.log('[gRPC] MediaClient initialized');
  }

  async GeneratePresignedUrlClient(
    service: string,
    resourceType: string,
    resourceId: string,
    files: FileMeta[],
  ): Promise<PresignResponse> {
    const generateRequest: PresignRequest = { service, resourceType, resourceId, files };
    const presignUrlResponse = await lastValueFrom(this.grpcMediaService.GeneratePresignedUrl(generateRequest));
    console.log('[Presigned URLs]', presignUrlResponse);
    return presignUrlResponse;
  }

  async ConfirmUploadClient(
    key: string,
    service: string,
    resourceId: string,
  ): Promise<ConfirmResponse> {
    const request: ConfirmRequest = { key, service, resourceId };
    const response = await lastValueFrom(this.grpcMediaService.ConfirmUpload(request));
    console.log('[Upload Confirmation]', response);
    return response;
  }
}
