import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Ensure required environment variables are set
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) {
    console.error('Missing AWS environment variables. Please check your .env file.');
    process.exit(1); // Exit the process if critical env vars are missing
}

/**
 * AWS S3 Client instance.
 * Configured with credentials and region from environment variables.
 */
export const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * The name of the S3 bucket used for media storage.
 */
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;