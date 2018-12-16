import fs from 'fs'
import shell from 'shelljs'
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
    const typeDir = `type/${pack.name}`
    recreateFolder(controllerDir, serviceDir, typeDir)

    /**
     * generate controller and service
     */
    pack.services.forEach(service => {
        const fileName = `${service.name.toLowerCase()}.ts`
        let stream = fs.createWriteStream(`${controllerDir}/${fileName}`)

        stream.write(`import { Controller } from 'egg'\n
export default class ${service.name}Controller extends Controller {`)

        for (const method of service.methods) {
            stream.write(`\n
    public async ${ method.name}() {
        const { ctx } = this
        ctx.body = await ctx.service.${service.name.toLowerCase()}.${method.name}(${method.response.properties.map(() => 'null').join(',')})
    }`)
        }

        stream.write('\n}\n')
        stream.end()
        console.log('\ngenerated controller:', fileName)

        // ---

        stream = fs.createWriteStream(`${serviceDir}/${fileName}`)

        stream.write(`import { Service } from 'egg'\n
export default class ${service.name} extends Service {`)

        for (const method of service.methods) {
            stream.write(`\n
    public async ${ method.name}(${method.response.properties.map(property => `${property.name}: ${property.type}`).join(',')}) {
        return { ${method.response.properties.map(property => property.name).join(', ')} }
    }`)
        }

        stream.write('\n}\n')
        stream.end()
        console.log('generated service:', fileName)
    })

    /**
     * generate types
     */
    //     pack.messages.forEach(message => {
    //         const isRequestType = message.name.includes('Request')
    //         const fileName = `${message.name}${isRequestType ? '.d' : ''}.ts`
    //         const stream = fs.createWriteStream(`${typeDir}/${fileName}`)

    //         if (isRequestType) {
    //             stream.write(`interface ${message.name} extends Req {\n
    //     body: {${ message.properties.map(property => `\n        ${property.name}: ${property.type}`).join()}
    //     }
    // }\n`,
    //             )
    //         } else {
    //             stream.write(`export default class ${message.name} {\n
    //     constructor(${ message.properties.map(property => `${property.name}: ${property.type}`).join(', ')}) {
    // ${ message.properties.map(property => `        this.${property.name} = ${property.name}`).join('\n')}
    //     }
    // ${ message.properties.map(property => `\n    ${property.name}: ${property.type}`).join()}
    // }\n`,
    //             )
    //         }

    //         stream.end()
    //         console.log('generated %s: %s', isRequestType ? 'type' : 'class', fileName)
    //     })
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

function recreateFolder(...dirs: string[]) {
    dirs.forEach(dir => {
        shell.exec(`rm -rf ${dir}`)
        shell.exec(`mkdir -p ${dir}`)
    })
}
