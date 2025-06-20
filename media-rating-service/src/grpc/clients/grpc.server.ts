import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { handlers } from "../../services/media.service";

// Load .proto file
const packageDefinition = protoLoader.loadSync(
  path.join(__dirname, "../proto/media.proto"),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
);

const proto = grpc.loadPackageDefinition(packageDefinition).media as any;

// Create gRPC server
const server = new grpc.Server();

// Register service handlers
server.addService(proto.MediaService.service, handlers);

// Start gRPC server
server.bindAsync(
  "0.0.0.0:50053",
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error("Failed to start gRPC server:", err);
      process.exit(1);
    }
    console.log(`✅ Media gRPC running on port ${port}`);
  }
);
