import * as fs from 'fs'
import * as shell from 'shelljs'
import client from '../util/client'
import {
    Package,
    Service,
    Method,
    Message,
    Property,
} from './model'

async function main(proto: string) {
    try {
        const content = await getOnlineProtoFile(proto)
        generate(deserialize(content))
    } catch (error) {
        console.log(error)
    }
}
main('greeter.proto')

/**
 * deserialize from proto definition to AST
 */
function deserialize(content: string): Package {
    let pack
    let isParsingService = false
    let currentService
    let isParsingMessage = false
    let currentMessage

    for (const line of content.split('\n')) {

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
            const [str, name, req, res] = /rpc\s+(.*?)\s+\((.*?)\)\s+returns\s+\((.*?)\)\s+{}/.exec(line)!

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
            const name = /message\s+(.*?)\s+{/.exec(line)![1]
            currentMessage = pack.messages.find(message => name === message.name)

            if (!pack) {
                throw new Error(`proto error: unused message [${name}]`)
            }
            console.log('    parsing message: ', name)
            continue
        }
        if (isParsingMessage && line !== '}') {
            // @ts-ignore
            const [str, type, name, binaryId] = /\s+(.*?)\s+(.*?)\s+=\s+(.*?);/.exec(line)!
            const property = new Property(name, type, parseInt(binaryId))
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
function generate(pack: Package) {
    console.log('\nfinal AST: ', JSON.stringify(pack, null, '    '))

    const controllerDir = `${__dirname}/dist/controller`
    const serviceDir = `${__dirname}/dist/service`
    const protoDir = `${__dirname}/dist/proto`
    recreateDirs(controllerDir, serviceDir, protoDir)

    /**
     * generate routes
     */
    let stream = fs.createWriteStream(`${__dirname}/dist/router.ts`)
    stream.write(`import { Application } from 'egg'\n
export default (app: Application) => {\n
    const { controller, router } = app
    router.get('/', controller.home.index)

    const rp = app.router.namespace('/${pack.name}')`)

    pack.services.forEach(service => {
        for (const method of service.methods) {
            stream.write(`\n    rp.get('/${method.name}', controller.${service.name.toLowerCase()}.${method.name})`)
        }
    })

    stream.write('\n}\n')
    stream.end()
    console.log('\ngenerated router:', 'router.ts')

    pack.services.forEach(service => {
        /**
         * generate controller
         */
        const fileName = `${service.name.toLowerCase()}.ts`
        stream = fs.createWriteStream(`${controllerDir}/${fileName}`)

        stream.write(`import { Controller } from 'egg'\n
export default class ${service.name}Controller extends Controller {`)

        for (const method of service.methods) {
            stream.write(`\n
    public async ${method.name}() {
        const { ctx } = this
        ctx.body = await ctx.service.${service.name.toLowerCase()}.${method.name}(${method.request.properties.map(() => 'null').join(',')})
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
    public async ${method.name}(${method.request.properties.map(property => `${property.name}: ${property.type}`).join(',')}) {
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
        service.methods.forEach(method => {
            [method.request, method.response].forEach(message => {
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
    })
}

/**
 * helper methods
 */
function getOnlineProtoFile(filename: string) {
    const url = `https://raw.githubusercontent.com/xiaozhongliu/ts-rpc-seed/master/proto/${filename}`
    return client.get(url)
}

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
