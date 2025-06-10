import { ClientOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const grpcOrderClientOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'order',
    protoPath: join(__dirname, './proto/order.proto'),
    url: 'localhost:50051',
  },
};
