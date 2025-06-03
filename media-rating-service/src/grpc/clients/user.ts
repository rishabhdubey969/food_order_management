import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PROTO_PATH = path.join(__dirname, '../proto/user-auth.proto');

// Load proto definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  defaults: true,
  oneofs: true,
  longs: String,
  enums: String,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const AuthService = protoDescriptor.auth.AuthService;

// 👇 Use the same host and port as your NestJS AuthService is running on
const authClient = new AuthService(
  process.env.AUTH_GRPC_URL || 'localhost:50051',
  grpc.credentials.createInsecure()
);

export { authClient };
