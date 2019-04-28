interface GreeterService {
    sayHello(request: HelloRequest, metadata?: grpc.Metadata): HelloReply
    sayGoodbye(request: HelloRequest, metadata?: grpc.Metadata): HelloReply
}
