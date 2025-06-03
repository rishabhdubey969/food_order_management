import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import dotenv from 'dotenv';
dotenv.config();

const packageDefinition = protoLoader.loadSync('proto/admin-auth.proto');
const adminProto = grpc.loadPackageDefinition(packageDefinition).admin as any;

export const adminAuthClient = new adminProto.AdminAuthService(
  process.env.ADMIN_AUTH_GRPC_URL || 'localhost:50052',
  grpc.credentials.createInsecure()
);