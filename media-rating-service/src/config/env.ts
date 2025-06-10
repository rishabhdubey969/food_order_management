import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || '3000',
  GRPC_PORT: process.env.GRPC_PORT || '50051',
  S3_REGION: process.env.S3_REGION!,
  S3_BUCKET: process.env.S3_BUCKET!,
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY!,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY!,
};
