import { Observable } from 'rxjs';

export const MEDIA_PACKAGE_NAME = 'media';
export const MEDIA_SERVICE_NAME = 'MediaService';

export interface PresignRequest {
  service: string;
  resourceType: string;
  resourceId: string;
  fileExtension: string;
  contentType: string;
}

export interface PresignResponse {
  presignedUrl: string;
  key: string;
}

export interface ConfirmRequest {
  key: string;
  service: string;
  resourceId: string;
}

export interface ConfirmResponse {
  success: boolean;
  message: string;
}

export interface GrpcMediaService {
  GeneratePresignedUrl(data: PresignRequest): Observable<PresignResponse>;
  ConfirmUpload(data: ConfirmRequest): Observable<ConfirmResponse>;
}
