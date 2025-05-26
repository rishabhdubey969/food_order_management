import {
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  _Object,
  ObjectCannedACL, // Import _Object for type hinting
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET_NAME } from "../config/aws";
import { IUploadedFile, IFileUrl } from "../interfaces/IMedia";
import { ApiError } from "../utils/errorHandler";
import { v4 as uuidv4 } from "uuid";

/**
 * S3Service class to handle all S3 related operations.
 */
class S3Service {
  /**
   * Uploads a single file to S3 using multer-s3's output.
   * @param file The file object provided by multer-s3.
   * @param folder The target folder (prefix) in the S3 bucket.
   * @returns A promise that resolves to the uploaded file's details.
   */
  public async uploadSingleFile(
    file: Express.Multer.File,
    folder: string
  ): Promise<IUploadedFile> {
    if (!file || !(file as any).location || !(file as any).key) {
      throw new ApiError(
        "File upload failed: Missing S3 location or key.",
        500
      );
    }

    const uploadedFile: IUploadedFile = {
      url: (file as any).location,
      key: (file as any).key,
      bucket: S3_BUCKET_NAME!,
      mimetype: file.mimetype,
      size: file.size,
    };
    return uploadedFile;
  }

  /**
   * Uploads multiple files to S3 using multer-s3's output.
   * @param files An array of file objects provided by multer-s3.
   * @param folder The target folder (prefix) in the S3 bucket.
   * @returns A promise that resolves to an array of uploaded file details.
   */
  public async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string
  ): Promise<IUploadedFile[]> {
    if (!files || files.length === 0) {
      throw new ApiError("No files provided for upload.", 400);
    }

    const uploadedFiles: IUploadedFile[] = files
      .map((file) => {
        if (!(file as any).location || !(file as any).key) {
          // Log and skip malformed files, or throw an error if strict
          console.warn(
            `Skipping malformed file in multiple upload: ${file.originalname}`
          );
          return null;
        }
        return {
          url: (file as any).location,
          key: (file as any).key,
          bucket: S3_BUCKET_NAME!,
          mimetype: file.mimetype,
          size: file.size,
        };
      })
      .filter(Boolean) as IUploadedFile[]; // Filter out any nulls

    if (uploadedFiles.length === 0) {
      throw new ApiError("No valid files were uploaded.", 500);
    }

    return uploadedFiles;
  }

  /**
   * Deletes a file from S3.
   * @param key The S3 object key of the file to delete.
   */
  public async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    try {
      await s3Client.send(command);
    } catch (error: any) {
      console.error(`Error deleting file ${key}:`, error);
      throw new ApiError(`Failed to delete file: ${error.message}`, 500);
    }
  }

  /**
   * Lists all files (or files within a specific folder) in the S3 bucket.
   * Generates pre-signed URLs for each listed object.
   * @param folder Optional. The folder (prefix) to list objects from.
   * @returns A promise that resolves to an array of file URLs and keys.
   */
  public async listFilesInFolder(folder?: string): Promise<IFileUrl[]> {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: folder ? `${folder}/` : undefined, // List objects within a specific folder
    });

    let isTruncated = true;
    let allObjects: _Object[] = [];
    let nextContinuationToken: string | undefined;

    try {
      while (isTruncated) {
        const { Contents, IsTruncated, NextContinuationToken } =
          await s3Client.send(command);
        if (Contents) {
          allObjects = allObjects.concat(Contents);
        }
        isTruncated = IsTruncated || false;
        nextContinuationToken = NextContinuationToken;
        command.input.ContinuationToken = nextContinuationToken;
      }

      const urlsWithKeys: IFileUrl[] = await Promise.all(
        allObjects.map(async (obj) => {
          if (obj.Key) {
            const getObjectParams = {
              Bucket: S3_BUCKET_NAME,
              Key: obj.Key,
            };
            // Generate a pre-signed URL for download, valid for 1 hour
            const url = await getSignedUrl(
              s3Client,
              new GetObjectCommand(getObjectParams),
              { expiresIn: 3600 }
            );
            return { url, key: obj.Key };
          }
          return null;
        })
      ).then((results) => results.filter(Boolean) as IFileUrl[]); // Filter out nulls

      return urlsWithKeys;
    } catch (error: any) {
      console.error(
        `Error listing files in folder ${folder || "root"}:`,
        error
      );
      throw new ApiError(`Failed to list files: ${error.message}`, 500);
    }
  }

  /**
   * Generates a pre-signed URL for downloading a private S3 object.
   * @param key The S3 object key of the file to download.
   * @returns A promise that resolves to the pre-signed download URL.
   */
  public async getSignedUrlForDownload(key: string): Promise<string> {
    const getObjectParams = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
    };
    try {
      // URL valid for 1 hour
      const url = await getSignedUrl(
        s3Client,
        new GetObjectCommand(getObjectParams),
        { expiresIn: 3600 }
      );
      return url;
    } catch (error: any) {
      console.error(`Error generating download URL for key ${key}:`, error);
      throw new ApiError(
        `Failed to generate download URL: ${error.message}`,
        500
      );
    }
  }

  /**
   * Generates a pre-signed URL for direct client-side S3 upload.
   * This allows clients to upload files directly to S3 without proxying through your server.
   * @param filename The original filename.
   * @param filetype The MIME type of the file (e.g., 'image/jpeg').
   * @param folder The target folder (prefix) in the S3 bucket.
   * @returns A promise that resolves to the pre-signed upload URL and the S3 key.
   */
   public async generatePresignedUrlForUpload(filename: string, filetype: string, folder: string = 'misc'): Promise<{ url: string, key: string }> {
        const uniqueFilename = `${folder}/${uuidv4()}-${filename}`;
        const putObjectParams = {
            Bucket: S3_BUCKET_NAME,
            Key: uniqueFilename,
            ContentType: filetype,
            ACL: ObjectCannedACL.public_read, // <--- REMOVE OR COMMENT OUT THIS LINE!
        };

        try {
            const url = await getSignedUrl(s3Client, new PutObjectCommand(putObjectParams), { expiresIn: 600 });
            return { url, key: uniqueFilename };
        } catch (error: any) {
            console.error(`Error generating pre-signed upload URL for ${uniqueFilename}:`, error);
            throw new ApiError(`Failed to generate upload URL: ${error.message}`, 500);
        }
    }
}

export const s3Service = new S3Service();
