import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { ApiError } from '../utils/error.handler'; // Still relevant for internal errors
import {
    PRESIGNED_URL_EXPIRATION_SECONDS,
    PRESIGNED_GET_URL_EXPIRATION_SECONDS,
    S3_BUCKET_NAME,
} from '../config/aws'; // Import config directly

// Ensure AWS SDK is configured globally for a unified S3 client instance
const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: 'v4', // Crucial for presigned URLs
});

export class S3Service {
    private readonly bucketName: string;

    constructor() {
        this.bucketName = S3_BUCKET_NAME!; // Already validated in aws.config
    }

    /**
     * Generates a presigned URL for a client to PUT (upload) an object directly to S3.
     * This method decides the unique S3 key including the temporary prefix.
     * @param originalFilename The original name of the file (e.g., 'avatar.png').
     * @param filetype The MIME type of the file (e.g., 'image/png').
     * @param permanentFolder The intended permanent folder (e.g., 'users/userId/avatars').
     * @returns An object containing the presigned URL and the full S3 key for the temporary location.
     */
    async generatePresignedUrl(originalFilename: string, filetype: string, permanentFolder: string = 'misc'): Promise<{ url: string; key: string }> {
        // Ensure folder path doesn't start or end with '/' if it's already structured
        const sanitizedFolder = permanentFolder.replace(/^\/|\/$/g, '');
        const fileExtension = originalFilename.split('.').pop();
        const uniqueId = uuidv4();
        
        // The key for the temporary location. S3 Lifecycle Policy will target 'temp-uploads/'
        const tempKey = `temp-uploads/${sanitizedFolder}/${uniqueId}-${originalFilename}`;

        const params = {
            Bucket: this.bucketName,
            Key: tempKey,
            Expires: PRESIGNED_URL_EXPIRATION_SECONDS, // Configured expiration
            ContentType: filetype,
            ACL: 'private', // Recommended: upload as private, then serve via presigned GET URL
        };

        try {
            const url = await s3.getSignedUrlPromise('putObject', params);
            Logger.debug(`Generated presigned PUT URL for S3 key: ${tempKey}`, 'S3Service');
            return { url: url, key: tempKey };
        } catch (error: any) {
            Logger.error(`Failed to generate presigned PUT URL for ${tempKey}: ${error.message}`, 'S3Service');
            throw new ApiError(`Failed to generate presigned URL: ${error.message}`, 500);
        }
    }

    /**
     * Generates a presigned URL for a client to GET (download) an object from S3.
     * @param key The full S3 key of the object.
     * @returns The presigned GET URL.
     */
    async getPresignedGetUrl(key: string): Promise<string> {
        const params = {
            Bucket: this.bucketName,
            Key: key,
            Expires: PRESIGNED_GET_URL_EXPIRATION_SECONDS, // Configured expiration
        };

        try {
            const url = await s3.getSignedUrlPromise('getObject', params);
            Logger.debug(`Generated presigned GET URL for S3 key: ${key}`, 'S3Service');
            return url;
        } catch (error: any) {
            Logger.error(`Failed to generate presigned GET URL for ${key}: ${error.message}`, 'S3Service');
            throw new ApiError(`Failed to retrieve file URL: ${error.message}`, 500);
        }
    }

    /**
     * Moves an object from a source S3 key to a destination S3 key.
     * Used to move files from temporary to permanent locations.
     * @param sourceKey The current S3 key (e.g., in temp-uploads/).
     * @param destinationKey The desired permanent S3 key.
     */
    async moveObject(sourceKey: string, destinationKey: string): Promise<void> {
        Logger.info(`Attempting to move S3 object from ${sourceKey} to ${destinationKey}`, 'S3Service');
        const copyParams = {
            Bucket: this.bucketName,
            CopySource: `${this.bucketName}/${sourceKey}`, // Source path including bucket name for CopySource
            Key: destinationKey,
            ACL: 'private', // Set desired ACL for the final object in its permanent location
        };

        try {
            await s3.copyObject(copyParams).promise();
            Logger.info(`Object copied from ${sourceKey} to ${destinationKey}`, 'S3Service');

            const deleteParams = {
                Bucket: this.bucketName,
                Key: sourceKey,
            };
            await s3.deleteObject(deleteParams).promise();
            Logger.info(`Original object deleted from ${sourceKey}`, 'S3Service');
        } catch (error: any) {
            Logger.error(`Error in S3 moveObject: ${error.message}`, 'S3Service');
            throw new ApiError(`Failed to move object: ${error.message}`, 500);
        }
    }

    /**
     * Deletes a file from S3.
     * @param key The full S3 key of the object to delete.
     */
    async deleteFile(key: string): Promise<void> {
        const params = {
            Bucket: this.bucketName,
            Key: key,
        };
        try {
            await s3.deleteObject(params).promise();
            Logger.info(`File deleted successfully: ${key}`, 'S3Service');
        } catch (error: any) {
            Logger.error(`Error deleting file ${key}: ${error.message}`, 'S3Service');
            throw new ApiError(`Failed to delete file: ${error.message}`, 500);
        }
    }

    /**
     * Lists files from S3 within a given prefix.
     * @param prefix The S3 prefix (folder) to list objects from.
     * @returns An array of S3 object keys.
     */
    async listFiles(prefix: string = ''): Promise<string[]> {
        const params = {
            Bucket: this.bucketName,
            Prefix: prefix,
        };
        try {
            const data = await s3.listObjectsV2(params).promise();
            const keys = data.Contents?.map(obj => obj.Key || '').filter(key => key) || [];
            Logger.debug(`Listed ${keys.length} files with prefix: ${prefix}`, 'S3Service');
            return keys;
        } catch (error: any) {
            Logger.error(`Error listing files from S3 with prefix ${prefix}: ${error.message}`, 'S3Service');
            throw new ApiError(`Failed to list files: ${error.message}`, 500);
        }
    }
}