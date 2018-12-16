import 'egg';

declare module 'egg' {
    interface Application {
        grpcClient
    }
    interface Service {
        service
    }
}
