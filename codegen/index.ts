import * as fs from 'fs'
import * as shell from 'shelljs'
import { promisify } from 'util'
import {
    Enum,
    Package,
    Service,
    Method,
    Message,
    Property,
} from './model'

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const controllerDir = `${__dirname}/dist/controller`
const serviceDir = `${__dirname}/dist/service`
const router = `${__dirname}/dist/router.ts`
const protoDir = `${__dirname}/dist/proto`

async function main() {
    try {
        recreateDirs(controllerDir, serviceDir, protoDir)

        const routerStream = fs.createWriteStream(router)
        routerStream.write(`import { Application } from 'egg'\n
export default (app: Application) => {\n
    let rp
    const { controller, router } = app
    router.get('/', controller.home.index)`)

        const sourceDir = './app/proto'
        const protos = await readdir(sourceDir)
        for (const proto of protos) {
            const content = await readFile(`${sourceDir}/${proto}`)
            generate(deserialize(content.toString()), routerStream)
        }

        routerStream.write('\n}\n')
        routerStream.end()
        console.log('\ngenerated router:', 'router.ts')
    } catch (error) {
        console.log(error)
    }
}
main()

/**
 * deserialize from proto definition to AST
 */
function deserialize(content: string): Package {
    let pack
    let isParsingService = false
    let currentService
    let isParsingMessage = false
    let currentMessage

    for (let line of content.split('\n')) {

        /**
         *  parse package
         */
        if (!pack && line.startsWith('package')) {
            const name = /package\s+(.*?);/.exec(line)![1]
            pack = new Package(name)

            console.log('\nparsing package: ', pack.name)
            continue
        }

        /**
         * parse services
         */
        if (!isParsingService && line.startsWith('service')) {
            if (!pack) {
                throw new Error('proto error: you should declare package first')
            }

            isParsingService = true
            const name = /service\s+(.*?)\s+{/.exec(line)![1]
            currentService = new Service(name, pack.name)
            pack.services.push(currentService)

            console.log('    parsing service: ', name)
            continue
        }
        if (isParsingService && /rpc\s+/.test(line)) {
            // @ts-ignore
            const [str, name, req, res] = /rpc\s+(.*?)\s*\((.*?)\)\s*returns\s*\((.*?)\)\s*{}/.exec(line)!

            let reqMessage
            let resMessage
            if (pack.messages.length) {
                reqMessage = pack.messages.find(message => req === message.name)
                resMessage = pack.messages.find(message => res === message.name)
            }
            if (!reqMessage) {
                reqMessage = new Message(req)
                pack.messages.push(reqMessage)
            }
            if (!resMessage) {
                resMessage = new Message(res)
                pack.messages.push(resMessage)
            }
            const method = new Method(name, reqMessage, resMessage)
            currentService.methods.push(method)

            console.log('        parsing method: ', name)
            continue
        }
        if (isParsingService && line === '}') {
            isParsingService = false
            currentService = undefined
            continue
        }

        /**
         * parse messages
         */
        if (!isParsingMessage && line.startsWith('message')) {
            isParsingMessage = true
            const name = /message\s+(.*?)\s*{/.exec(line)![1]
            currentMessage = pack.messages.find(message => name === message.name)
            if (!currentMessage) {
                currentMessage = new Message(name)
                pack.messages.push(currentMessage)
            }

            if (!pack) {
                throw new Error(`proto error: unused message [${name}]`)
            }
            console.log('    parsing message: ', name)
            continue
        }
        if (isParsingMessage && line !== '}') {
            const repeated = line.includes('repeated')
            if (repeated) {
                line = line.replace('repeated', '')
            }
            // @ts-ignore
            const [str, rawType, name, binaryId] = /\s+(.*?)\s+(.*?)\s*=\s*(.*?);/.exec(line)!
            const type = Enum.TypeMapping[rawType] || rawType
            const finalType = repeated ? `${type}[]` : type
            const property = new Property(name, finalType, parseInt(binaryId))
            currentMessage.properties.push(property)

            console.log('        parsed property: ', name)
            continue
        }
        if (isParsingMessage && line === '}') {
            isParsingMessage = false
            currentMessage = undefined
            continue
        }
    }

    return upodateMethodsMessages(pack)
}

/**
 * generate ts files from AST
 */
function generate(pack: Package, routerStream: fs.WriteStream) {
    console.log('\nfinal AST: ', JSON.stringify(pack, null, '    '))

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
        ctx.body = await ctx.service.${service.name.toLowerCase()}.${method.name}(${method.request.properties.map(() => 'null').join(', ')})
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
    readonly service: ${service.name}Service = this.app.grpcClient.get('default').${pack.name}.${service.name}`)

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
${service.methods.map(method => `    ${method.name}(request: ${method.request.name}): ${method.response.name}`).join('\n')}
}\n`,
        )

        stream.end()
        console.log('generated type: %s', serviceTypeFileName)

        /**
         * generate message types
         */
        pack.messages.forEach(message => {
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
function upodateMethodsMessages(pack: Package) {
    for (const { methods } of pack.services) {
        for (const method of methods) {
            const reqMessage = pack.messages.find(message => method.request.name === message.name)
            const resMessage = pack.messages.find(message => method.response.name === message.name)
            method.request = reqMessage as Message
            method.response = resMessage as Message
        }
    }
    return pack
}

function recreateDirs(...dirs: string[]) {
    dirs.forEach(dir => {
        shell.exec(`rm -rf ${dir}`)
        shell.exec(`mkdir -p ${dir}`)
    })
}
