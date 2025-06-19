import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3, S3_BUCKET } from '../config/aws';
import { buildS3Key } from '../utils/path';
import { v4 as uuid } from 'uuid';

export const handlers = {

  /**
   * Generates presigned URLs for uploading files to S3.
   * @param call - gRPC call containing service, resourceType, resourceId, and files.
   * @param callback - Callback function to return the generated URLs or an error.
   */ 
  GeneratePresignedUrl: async (
    call: {
      request: {
        service: string;
        resourceType: string;
        resourceId: string;
        files: Array<{ fileExtension: string; contentType: string }>;
      };
    },
    callback: ( // Callback function to return the result
      error: { code: number; message: string } | null,
      response?: { urls: Array<{ presignedUrl: string; key: string }> }
    ) => void
  ) => {
    const { service, resourceType, resourceId, files } = call.request;

    if (!['user', 'product', 'admin'].includes(service)) {
      return callback({ code: 7, message: 'Unauthorized service' }, undefined);
    }

    try {
        
      const urls = await Promise.all(
        files.map(async (file) => {
          const fileName = `${uuid()}.${file.fileExtension}`;
          const fileKey = buildS3Key(service, resourceType, resourceId, fileName);

          const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: fileKey,
            ContentType: file.contentType,
          });

          const url = await getSignedUrl(s3, command, { expiresIn: 300 });

          return { presignedUrl: url, key: fileKey };
        })
      );   // Generate presigned URLs for each file    

      callback(null, { urls });
    } catch (err) {
      console.error('Error generating presigned URLs:', err);
      callback({ code: 13, message: 'Internal Server Error' }, undefined);
    }
  },

  /**
   * Confirms the upload of a file by checking if it exists in S3.
   * @param call - gRPC call containing the key, service, and resourceId.
   * @param callback - Callback function to return success or failure message.
   */
  ConfirmUpload: async (
    call: { request: { key: string; service: string; resourceId: string } },
    callback: (error: null, response: { success: boolean; message: string }) => void
  ) => {
    const { key } = call.request;
    try {
      await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key })); // Check if the file exists in S3
      callback(null, { success: true, message: 'Upload confirmed' });
    } catch {
      callback(null, { success: false, message: 'File not found' });
    }
  },
};
