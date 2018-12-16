import { EggAppConfig, PowerPartial } from 'egg'

export default () => {
    const config: PowerPartial<EggAppConfig> = {

        grpcClient: {
            clients: {
                default: {
                    protoPath: 'app/proto',
                    host: '0.0.0.0',
                    port: '50051',
                },
            },
        },
    }
    return config
}
