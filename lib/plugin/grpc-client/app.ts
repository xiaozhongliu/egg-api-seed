import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import * as grpc from 'grpc'
import * as loader from '@grpc/proto-loader'
import { Application } from 'egg'

const exists = util.promisify(fs.exists)
const readdir = util.promisify(fs.readdir)

export default async (app: Application) => {
    const clientServicesMap: Indexed = {}
    await Promise.all(
        app.config.grpcClient.clients.map(async (clientConfig: ClientConfig) => {
            const services = await getMultiTierServices(app, clientConfig)
            clientServicesMap[clientConfig.name] = services
        }),
    )
    app.grpcClient = clientServicesMap
}

async function getMultiTierServices(app: Application, clientConfig: ClientConfig) {
    const services: Indexed = {}
    const protoDir = path.join(app.baseDir, clientConfig.protoPath)

    if (!await exists(protoDir)) {
        throw new Error('proto directory not exist')
    }
    const protoFileList = await readdir(protoDir)
    for (const protoFile of protoFileList) {
        if (path.extname(protoFile) !== '.proto') { continue }

        const proto = await loader.load(
            path.join(protoDir, protoFile),
            app.config.grpcClient.loaderOption || {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
            },
        )
        const definition = grpc.loadPackageDefinition(proto)

        for (const packName of Object.keys(definition)) {
            let currentTier
            const tiers = packName.split('.')
            for (const tier of tiers) {
                currentTier = services[tier]
                if (!currentTier) {
                    currentTier = services[tier] = {}
                }
            }

            const address = `${clientConfig.host}:${clientConfig.port}`
            const credentials = grpc.credentials.createInsecure()
            const pack: Indexed = definition[packName]
            for (const serviceName of Object.keys(pack)) {
                const ServiceClass = pack[serviceName]
                const service = new ServiceClass(address, credentials)

                currentTier[serviceName] = service
                for (const methodName of Object.keys(ServiceClass.service)) {
                    service[methodName] = util.promisify(service[methodName])
                }
            }
        }
    }

    return services
}
