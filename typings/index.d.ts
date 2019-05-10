import 'egg'

declare module 'egg' {
    interface Application {
        grpcClient
        customLogger: {
            request(message: object): void
            debug(message: object): void
            info(message: object): void
            warn(message: object): void
            error(message: object): void
            fatal(message: object): void
        }
    }
    interface Service {
        service
    }
}
