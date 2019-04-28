import fs from 'fs'
import shell from 'shelljs'
import { promisify } from 'util'
import { Package } from './model'
import deserialize from './deserialize'
import config from '../config/config.local'

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const controllerDir = `${__dirname}/dist/controller`
const serviceDir = `${__dirname}/dist/service`
const router = `${__dirname}/dist/router.ts`
const protoDir = `${__dirname}/dist/proto`

async function main() {
    recreateDirs(controllerDir, serviceDir, protoDir)

    const routerStream = fs.createWriteStream(router)
    routerStream.write(`import { Application } from 'egg'\n
export default (app: Application) => {\n
    let rp
    const { controller, router } = app
    router.get('/', controller.home.index)`)

    for (const client of config().grpcClient.clients) {
        const sourceDir = client.protoPath
        const protos = await readdir(sourceDir)
        for (const proto of protos) {
            const content = await readFile(`${sourceDir}/${proto}`)
            generate(deserialize(content.toString()), routerStream, client.name)
        }
    }

    routerStream.write('\n}\n')
    routerStream.end()
    console.log('\ngenerated router:', 'router.ts')
}
main()

/**
 * generate ts files from AST
 */
function generate(pack: Package, routerStream: fs.WriteStream, clientName: string) {
    console.log(`\nfinal AST: ${JSON.stringify(pack, undefined, '    ')}\n`)

    /**
     * generate routes
     */
    routerStream.write(`\n\n    rp = app.router.namespace('/${pack.name}')`)

    pack.services.forEach(service => {
        for (const method of service.methods) {
            routerStream.write(`\n    rp.get('/${method.name}', controller.${service.name.toLowerCase()}.${method.name})`)
        }
    })

    pack.services.forEach(service => {
        /**
         * generate controller
         */
        const fileName = `${service.name.toLowerCase()}.ts`
        let stream = fs.createWriteStream(`${controllerDir}/${fileName}`)

        stream.write(`import { Controller } from 'egg'\n
export default class ${service.name}Controller extends Controller {`)

        for (const method of service.methods) {
            stream.write(`\n
    public async ${method.name}() {
        const { ctx } = this
        ctx.body = await ctx.service.${service.name.toLowerCase()}.${method.name}(${method.request.properties.map(() => 'undefined').join(', ')})
    }`)
        }

        stream.write('\n}\n')
        stream.end()
        console.log('generated controller:', fileName)

        /**
         * generate service
         */
        stream = fs.createWriteStream(`${serviceDir}/${fileName}`)

        stream.write(`import { Service } from 'egg'\n
export default class ${service.name} extends Service {\n
    readonly service: ${service.name}Service = this.app.grpcClient.${clientName}.${pack.name}.${service.name}`)

        for (const method of service.methods) {
            stream.write(`\n
    public async ${method.name}(${method.request.properties.map(property => `${property.name}: ${property.type}`).join(', ')}) {
        return this.service.${method.name}({ ${method.request.properties.map(property => property.name).join(', ')} })
    }`)
        }

        stream.write('\n}\n')
        stream.end()
        console.log('generated service:', fileName)

        /**
         * generate service type
         */
        shell.exec(`mkdir -p ${protoDir}/${service.package}`)
        const serviceTypeFileName = `${service.package}/${service.name}Service.d.ts`
        stream = fs.createWriteStream(`${protoDir}/${serviceTypeFileName}`)

        stream.write(`interface ${service.name}Service {
${service.methods.map(method => {
            const returnType = method.response.name !== 'google.protobuf.Empty' ? method.response.name : 'void'
            return `    ${method.name}(request: ${method.request.name}, metadata?: grpc.Metadata): ${returnType}`
        }).join('\n')}
}\n`,
        )

        stream.end()
        console.log('generated type: %s', serviceTypeFileName)

        /**
         * generate message types
         */
        pack.messages.forEach(message => {
            if (message.name === 'google.protobuf.Empty') return

            const messageTypeFileName = `${service.package}/${message.name}.d.ts`
            stream = fs.createWriteStream(`${protoDir}/${messageTypeFileName}`)

            stream.write(`interface ${message.name} {
${message.properties.map(property => `    ${property.name}: ${property.type}`).join('\n')}
}\n`,
            )

            stream.end()
            console.log('generated type: %s', messageTypeFileName)
        })
    })
}

/**
 * helper methods
 */
function recreateDirs(...dirs: string[]) {
    dirs.forEach(dir => {
        shell.exec(`rm -rf ${dir}`)
        shell.exec(`mkdir -p ${dir}`)
    })
}
