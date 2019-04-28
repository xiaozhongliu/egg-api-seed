import { EggPlugin } from 'egg'
import path from 'path'

const plugin: EggPlugin = {

    routerPlus: {
        enable: true,
        package: 'egg-router-plus',
    },
    grpcClient: {
        enable: true,
        package: 'grpc-client',
        path: path.join(__dirname, '../lib/plugin/grpc-client'),
    },
}

export default plugin
