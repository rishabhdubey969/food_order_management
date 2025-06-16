import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || '3000',
  GRPC_PORT: process.env.GRPC_PORT || '50052',
  S3_REGION: process.env.AWS_REGION!,
  S3_BUCKET: process.env.S3_BUCKET_NAME!,
  S3_ACCESS_KEY: process.env.AWS_ACCESS_KEY_ID!,
  S3_SECRET_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
};
