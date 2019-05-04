import { EggAppConfig, PowerPartial } from 'egg'

export default () => {
    const config: PowerPartial<EggAppConfig> = {

        DEBUG: true,

        grpcClient: {
            clients: [
                {
                    name: 'main',
                    protoPath: 'app/proto/main',
                    host: '0.0.0.0',
                    port: 50051,
                },
            ],
        },
    }
    return config
}
