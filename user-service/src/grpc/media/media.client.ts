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
      url: '127.0.0.1:50053',
    },
  })
  private client: ClientGrpc;

  private grpcMediaService: GrpcMediaService;

  /**
   * Initializes the gRPC client and retrieves the media service.
   */
  onModuleInit() {
    this.grpcMediaService = this.client.getService<GrpcMediaService>(MEDIA_SERVICE_NAME);
    console.log('[gRPC] MediaClient initialized');
  }

  /**
   * Generates presigned URLs for file uploads to the specified service and resource.
   * @param service - The service where the files will be uploaded.
   * @param resourceType - The type of resource (e.g., 'user', 'post').
   * @param resourceId - The ID of the resource associated with the upload.
   * @param files - An array of file metadata objects containing file extension and content type.
   * @returns A promise that resolves to the presigned URL response.
   */
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

  /**
   * Confirms the upload of a file to the specified service and resource.
   * @param key - The unique key for the uploaded file.
   * @param service - The service where the file is uploaded.
   * @param resourceId - The ID of the resource associated with the upload.
   * @returns A promise that resolves to the confirmation response.
   */
  async ConfirmUploadClient(key: string, service: string, resourceId: string): Promise<ConfirmResponse> {
    const request: ConfirmRequest = { key, service, resourceId };
    const response = await lastValueFrom(this.grpcMediaService.ConfirmUpload(request));
    console.log('[Upload Confirmation]', response);
    return response;
  }
}
