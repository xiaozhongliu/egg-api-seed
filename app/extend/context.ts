import fs from 'fs'
import os from 'os'
import log4js from 'log4js'
import moment from 'moment'
import 'moment/locale/zh-cn'
import { EggAppConfig } from 'egg'

export default {
    log4js() {
        const config: EggAppConfig = this.app.config

        // get host ip address
        const networksOrigin = os.networkInterfaces()
        const networks =
            networksOrigin.eth0 ||
            networksOrigin.eth1 ||
            networksOrigin.en0 ||
            networksOrigin.en1 ||
            networksOrigin.本地连接
        const address = networks.find(network => network.family === 'IPv4')


        const layout = {
            type: 'dateFile',
            pattern: '%m',
        }
        const appenders = {
            dateFile: {
                type: 'dateFile',
                category: 'APP',
                pattern: 'yyyyMMdd.log',
                alwaysIncludePattern: true,
                filename: config.LOG_PATH,
                layout,
            },
        }
        const categories = {
            default: { appenders: ['dateFile'], level: 'info' },
        }

        // non prod logs also output to console
        if (config.DEBUG) {
            // @ts-ignore
            appenders.console = { type: 'console', layout }
            categories.default.appenders.push('console')
        }

        // create the log path if it doesn't exist
        fs.existsSync(config.LOG_PATH) || fs.mkdirSync(config.LOG_PATH)

        log4js.configure({
            appenders,
            categories,
            disableClustering: true,
        })

        const logger = log4js.getLogger('APP')
        logger.level = 'debug'

        function log(data: object) {
            logger.info(JSON.stringify(Object.assign({
                '@appname': config.API_NAME,
                '@servername': os.hostname(),
                '@serverip': address.address,
                '@env': process.env.NODE_ENV,
                '@timestamp': moment().toISOString(),
                event: 'TBD',
            }, data)))
        }

        return {
            info(message: string) {
                log({ message })
            },

            error(message: string) {
                log({ message })
            },

            launch(message: string) {
                log({ message })
            },

            invoke(data: object) {
                log(data)
            },
        }
    },
}
