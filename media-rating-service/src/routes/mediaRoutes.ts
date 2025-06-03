import { Router } from 'express';
import { mediaController } from '../controllers/mediaController';
import { uploadSingle, uploadArray } from '../middleware/uploadMiddleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 * name: Media Service
 * description: API for managing media files in S3
 */

/**
 * @swagger
 * /api/v1/upload-single:
 * post:
 * summary: Uploads a single image file to S3.
 * tags: [Media Service]
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * properties:
 * image:
 * type: string
 * format: binary
 * description: The image file to upload.
 * folder:
 * type: string
 * description: Optional folder (prefix) in S3 to store the image (e.g., 'product', 'user'). Defaults to 'misc'.
 * responses:
 * 200:
 * description: Image uploaded successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status: { type: string, example: "success" }
 * message: { type: string, example: "Image uploaded successfully!" }
 * data:
 * type: object
 * properties:
 * url: { type: string, example: "https://your-bucket.s3.aws-region.amazonaws.com/product/uuid-image.jpg" }
 * key: { type: string, example: "product/uuid-image.jpg" }
 * bucket: { type: string, example: "your-media-bucket" }
 * mimetype: { type: string, example: "image/jpeg" }
 * size: { type: number, example: 123456 }
 * 400:
 * description: Bad request (e.g., no file uploaded, invalid file type).
 * 500:
 * description: Server error.
 */
router.post('/upload-single',  uploadSingle, mediaController.uploadSingleImage);

/**
 * @swagger
 * /api/v1/upload-multiple:
 * post:
 * summary: Uploads multiple image files to S3.
 * tags: [Media Service]
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * properties:
 * images:
 * type: array
 * items:
 * type: string
 * format: binary
 * description: An array of image files to upload.
 * folder:
 * type: string
 * description: Optional folder (prefix) in S3 to store the images (e.g., 'product', 'user'). Defaults to 'misc'.
 * responses:
 * 200:
 * description: Images uploaded successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status: { type: string, example: "success" }
 * message: { type: string, example: "Images uploaded successfully!" }
 * data:
 * type: array
 * items:
 * $ref: '#/components/schemas/UploadedFile' # Reference to a schema defined elsewhere
 * 400:
 * description: Bad request (e.g., no files uploaded, invalid file type).
 * 500:
 * description: Server error.
 */
router.post('/upload-multiple', uploadArray, mediaController.uploadMultipleImages);

/**
 * @swagger
 * /api/v1/delete:
 * delete:
 * summary: Deletes an image from S3.
 * tags: [Media Service]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - key
 * properties:
 * key:
 * type: string
 * example: "product/uuid-image.jpg"
 * description: The S3 object key of the image to delete.
 * responses:
 * 200:
 * description: Image deleted successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status: { type: string, example: "success" }
 * message: { type: string, example: "Image with key product/uuid-image.jpg deleted successfully." }
 * 400:
 * description: Bad request (e.g., S3 object key is missing).
 * 500:
 * description: Server error.
 */
router.delete('/delete', mediaController.deleteImage);

/**
 * @swagger
 * /api/v1/list:
 * get:
 * summary: Lists all image URLs in the S3 bucket, optionally filtered by folder.
 * tags: [Media Service]
 * parameters:
 * - in: query
 * name: folder
 * schema:
 * type: string
 * description: Optional folder (prefix) to list images from (e.g., 'product', 'user').
 * responses:
 * 200:
 * description: Successfully retrieved image URLs.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status: { type: string, example: "success" }
 * message: { type: string, example: "Successfully retrieved image URLs." }
 * data:
 * type: array
 * items:
 * type: object
 * properties:
 * url: { type: string, example: "https://your-bucket.s3.aws-region.amazonaws.com/product/uuid-image.jpg?AWSAccessKeyId=..." }
 * key: { type: string, example: "product/uuid-image.jpg" }
 * 500:
 * description: Server error.
 */
router.get('/list', authMiddleware,  mediaController.getAllUrls);

/**
 * @swagger
 * /api/v1/get-url:
 * get:
 * summary: Gets a pre-signed URL for a single image by its S3 key.
 * tags: [Media Service]
 * parameters:
 * - in: query
 * name: key
 * schema:
 * type: string
 * required: true
 * example: "user/user-id-abc/profile.png"
 * description: The S3 object key of the image.
 * responses:
 * 200:
 * description: Successfully retrieved URL.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status: { type: string, example: "success" }
 * message: { type: string, example: "Successfully retrieved URL for key user/user-id-abc/profile.png." }
 * data:
 * type: object
 * properties:
 * url: { type: string, example: "https://your-bucket.s3.aws-region.amazonaws.com/user/user-id-abc/profile.png?AWSAccessKeyId=..." }
 * key: { type: string, example: "user/user-id-abc/profile.png" }
 * 400:
 * description: Bad request (e.g., S3 object key is missing).
 * 500:
 * description: Server error.
 */
router.get('/get-url', mediaController.getSingleUrl);

/**
 * @swagger
 * /api/v1/generate-upload-presigned-url:
 * post:
 * summary: Generates a pre-signed URL for direct client-side S3 upload.
 * tags: [Media Service]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - filename
 * - filetype
 * properties:
 * filename:
 * type: string
 * example: "new-product-photo.jpeg"
 * description: The desired original filename for the upload.
 * filetype:
 * type: string
 * example: "image/jpeg"
 * description: The MIME type of the file to be uploaded.
 * folder:
 * type: string
 * example: "temp-uploads"
 * description: Optional folder (prefix) in S3 to store the image. Defaults to 'misc'.
 * responses:
 * 200:
 * description: Pre-signed upload URL generated successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status: { type: string, example: "success" }
 * message: { type: string, example: "Pre-signed upload URL generated successfully." }
 * data:
 * type: object
 * properties:
 * url: { type: string, example: "https://your-bucket.s3.aws-region.amazonaws.com/temp-uploads/uuid-new-product-photo.jpeg?AWSAccessKeyId=..." }
 * key: { type: string, example: "temp-uploads/uuid-new-product-photo.jpeg" }
 * 400:
 * description: Bad request (e.g., filename or filetype missing).
 * 500:
 * description: Server error.
 */
router.post('/generate-upload-presigned-url', mediaController.generateUploadPresignedUrl);

export default router;