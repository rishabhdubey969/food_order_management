import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3Client, S3_BUCKET_NAME } from '../config/aws';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { ApiError } from '../utils/error.handler';
// import {
//   ObjectCannedACL, // Import _Object for type hinting
// } from "@aws-sdk/client-s3";

// Type definition for the request body that includes a 'folder' property
interface UploadRequestBody extends Request {
    body: {
        folder?: string;
    };
}

/**
 * Configures multer-s3 storage to determine the S3 key (path) for uploaded files.
 * The key will be structured as `folder/uuid-originalfilename`.
 */
const s3Storage = multerS3({
    s3: s3Client as any,
    bucket: S3_BUCKET_NAME!,
    // acl: ObjectCannedACL.public_read, // <--- REMOVE OR COMMENT OUT THIS LINE!
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req: UploadRequestBody, file: Express.Multer.File, cb: (error: any, key?: string) => void) => {
        const folder = req.body.folder || 'misc';
        const uniqueFilename = `${folder}/${uuidv4()}-${file.originalname}`;
        cb(null, uniqueFilename);
    },
});

/**
 * Multer instance for handling single file uploads.
 * 'image' is the field name expected in the form-data.
 */
export const uploadSingle = multer({
    storage: s3Storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
    fileFilter: (req, file, cb) => {
        // Basic file type validation
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new ApiError('Only image files are allowed!', 400));
        }
    }
}).single('image'); // 'image' is the name of the input field in the form

/**
 * Multer instance for handling multiple file uploads.
 * 'images' is the field name expected in the form-data, max 10 files.
 */
export const uploadArray = multer({
    storage: s3Storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file limit
    fileFilter: (req, file, cb) => {
        // Basic file type validation
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new ApiError('Only image files are allowed!', 400));
        }
    }
}).array('images', 10); // 'images' is the name of the input field, max 10 files