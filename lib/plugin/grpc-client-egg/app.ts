import * as path from 'path'
import * as util from 'util'
import * as grpc from 'grpc'
import * as loader from '@grpc/proto-loader'
import { promises as fs, constants } from 'fs'
import { Application } from 'egg'
import config from './config'

interface ClientConfig {
    name: string,
    protoPath: string,
    host: string,
    port: number,
}

export default async (app: Application) => {
    const clientServicesMap: Indexed = {}
    const clients = app.config.grpcClient.clients || config.clients
    await Promise.all(clients.map(async (clientConfig: ClientConfig) => {
        const services = await getMultiTierServices(app, clientConfig)
        clientServicesMap[clientConfig.name] = services
    }))
    app.grpcClient = clientServicesMap
}

async function getMultiTierServices(app: Application, clientConfig: ClientConfig) {
    const services: Indexed = {}
    const protoDir = path.join(app.baseDir, clientConfig.protoPath)

    try {
        await fs.access(protoDir, constants.F_OK)
    } catch (error) {
        throw new Error('proto directory does not exist')
    }

    const protoFileList = await fs.readdir(protoDir)
    for (const protoFile of protoFileList) {
        if (path.extname(protoFile) !== '.proto') { continue }

        const proto = await loader.load(
            path.join(protoDir, protoFile),
            app.config.grpcClient.loaderOption || config.loaderOption,
        )
        const definition = grpc.loadPackageDefinition(proto)

        for (const packName of Object.keys(definition)) {
            if (!services[packName]) {
                services[packName] = definition[packName]
            }
            const tier: Indexed = definition[packName]
            traverseDefinition(services, tier, packName, clientConfig)
        }
    }

    return services
}

async function traverseDefinition(relevantParent: any, tier: any, tierName: string, clientConfig: ClientConfig) {
    if (tier.name === 'ServiceClient') {
        return addServiceClient(relevantParent, tier, tierName, clientConfig)
    }

    for (const subTierName of Object.keys(tier)) {
        let relevantCurrent = relevantParent[tierName]
        if (relevantCurrent.format) {
            return delete relevantParent[tierName]
        }
        if (!relevantCurrent) {
            relevantCurrent = relevantParent[tierName] = {}
        }
        if (!tier[subTierName].format) {
            traverseDefinition(relevantCurrent, tier[subTierName], subTierName, clientConfig)
        }
    }
}

async function addServiceClient(relevantParent: any, tier: any, tierName: string, clientConfig: ClientConfig) {
    const ServiceClient = tier
    const address = `${clientConfig.host}:${clientConfig.port}`
    const credentials = grpc.credentials.createInsecure()
    const client = new ServiceClient(address, credentials)

    relevantParent[tierName] = client
    for (const methodName of Object.keys(ServiceClient.service)) {
        client[methodName] = util.promisify(client[methodName])
    }
}
