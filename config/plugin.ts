import { EggPlugin } from 'egg'

const plugin: EggPlugin = {
    routerPlus: {
        enable: true,
        package: 'egg-router-plus',
    },
    grpcClient: {
        enable: true,
        package: 'egg-grpc-client',
    },
}
export default plugin
