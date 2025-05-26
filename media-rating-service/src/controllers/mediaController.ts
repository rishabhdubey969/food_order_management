import { Request, Response, NextFunction } from 'express';
import { s3Service } from '../services/s3Service';
import { asyncHandler, ApiError } from '../utils/errorHandler';
import { IDeleteImageBody, IGeneratePresignedUrlBody, IGetSingleFileQuery, IListFilesQuery } from '../interfaces/IMedia';

/**
 * MediaController class to handle API requests related to media.
 */
class MediaController {

    /**
     * Handles single image upload requests.
     * Uses multer-s3 middleware to directly upload to S3.
     */
    public uploadSingleImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        console.log(req);
        if (!req.file) {
            throw new ApiError('No file uploaded.', 400);
        }
        // The file is already uploaded to S3 by multer-s3 middleware
        const folder = (req.body as { folder?: string }).folder || 'misc';
        const uploadedFile = await s3Service.uploadSingleFile(req.file, folder);

        res.status(200).json({
            status: 'success',
            message: 'Image uploaded successfully!',
            data: uploadedFile,
        });
    });

    /**
     * Handles multiple image upload requests.
     * Uses multer-s3 middleware to directly upload to S3.
     */
    public uploadMultipleImages = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            throw new ApiError('No files uploaded.', 400);
        }

        const folder = (req.body as { folder?: string }).folder || 'misc';
        const uploadedFiles = await s3Service.uploadMultipleFiles(req.files as Express.Multer.File[], folder);

        res.status(200).json({
            status: 'success',
            message: 'Images uploaded successfully!',
            data: uploadedFiles,
        });
    });

    /**
     * Handles image deletion requests.
     */
    public deleteImage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { key } = req.body as IDeleteImageBody;

        if (!key) {
            throw new ApiError('S3 object key is required for deletion.', 400);
        }

        await s3Service.deleteFile(key);

        res.status(200).json({
            status: 'success',
            message: `Image with key ${key} deleted successfully.`,
        });
    });

    /**
     * Handles requests to get all URLs (optionally filtered by folder).
     */
    public getAllUrls = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { folder } = req.query as IListFilesQuery;

        const urls = await s3Service.listFilesInFolder(folder);

        res.status(200).json({
            status: 'success',
            message: 'Successfully retrieved image URLs.',
            data: urls,
        });
    });

    /**
     * Handles requests to get a single URL by S3 key.
     */
    public getSingleUrl = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { key } = req.query as unknown as IGetSingleFileQuery;

        if (!key) {
            throw new ApiError('S3 object key is required.', 400);
        }

        const url = await s3Service.getSignedUrlForDownload(key);

        res.status(200).json({
            status: 'success',
            message: `Successfully retrieved URL for key ${key}.`,
            data: { url, key },
        });
    });

    /**
     * Handles requests to generate a pre-signed URL for direct client-side upload.
     */
    public generateUploadPresignedUrl = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { filename, filetype, folder } = req.body as IGeneratePresignedUrlBody;

        if (!filename || !filetype) {
            throw new ApiError('Filename and filetype are required.', 400);
        }

        const { url, key } = await s3Service.generatePresignedUrlForUpload(filename, filetype, folder);

        res.status(200).json({
            status: 'success',
            message: 'Pre-signed upload URL generated successfully.',
            data: { url, key },
        });
    });
}

export const mediaController = new MediaController();