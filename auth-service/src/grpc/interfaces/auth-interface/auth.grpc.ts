import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';

export interface GrpcMethodInterface<T, R> {
  (data: T, metadata: Metadata, call: ServerUnaryCall<T, R>): Promise<R>;
}