import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3, S3_BUCKET } from '../config/aws';
import { buildS3Key } from '../utils/path';
import { v4 as uuid } from 'uuid';

export const handlers = {

  GeneratePresignedUrl: async (call: { request: { service: string; resourceType: string; resourceId: string; fileExtension: string; contentType: string; }; }, callback: (arg0: { code: number; message: string; } | null, arg1: { presignedUrl: string; key: string; } | undefined) => void) => {
    
    const { service, resourceType, resourceId, fileExtension, contentType } = call.request;
    if (!['user','product','admin'].includes(service)) {
      return callback({ code: 7, message: 'Unauthorized service' }, undefined);
    }
    const fileName = `${uuid()}.${fileExtension}`;
    const fileKey = buildS3Key(service, resourceType, resourceId, fileName);

    const cmd = new PutObjectCommand({ Bucket: S3_BUCKET, Key: fileKey, ContentType: contentType });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    callback(null, { presignedUrl: url, key:fileKey });
  },

  ConfirmUpload: async (call: { request: { fileKey: any; }; }, callback: (arg0: null, arg1: { success: boolean; message: string; }) => void) => {
    const { fileKey } = call.request;
    try {
      await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: fileKey }));
      callback(null, { success: true, message: 'Upload confirmed' });
    } catch {
      callback(null, { success: false, message: 'File not found' });
    }
  },
};
