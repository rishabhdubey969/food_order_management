import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import dotenv from 'dotenv';
dotenv.config();

const packageDefinition = protoLoader.loadSync('proto/manager-auth.proto');
const managerProto = grpc.loadPackageDefinition(packageDefinition).manager as any;

export const managerAuthClient = new managerProto.ManagerAuthService(
  process.env.MANAGER_AUTH_GRPC_URL || 'localhost:50053',
  grpc.credentials.createInsecure()
);