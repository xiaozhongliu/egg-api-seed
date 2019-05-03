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

        function getAppender(type: string) {
            return {
                type: 'dateFile',
                category: type,
                alwaysIncludePattern: true,
                pattern: `.yyyyMMdd.log`,
                filename: config[`${type.toUpperCase()}_LOG_PATH`],
                layout,
            }
        }

        const layout = { type: 'pattern', pattern: '%m' }
        const appenders = {
            common: getAppender('common'),
            request: getAppender('request'),
        }
        const categories = {
            default: { appenders: ['common'], level: config.DEBUG ? 'debug' : 'info' },
            request: { appenders: ['request'], level: 'info' },
        }

        // non prod logs also output to console
        if (config.DEBUG) {
            // @ts-ignore
            appenders.console = { type: 'console', layout }
            categories.default.appenders.push('console')
        }
        log4js.configure({
            appenders,
            categories,
            disableClustering: true,
        })

        const commonLogger = log4js.getLogger('common')
        const requestLogger = log4js.getLogger('request')

        function mergeData(data: object) {
            return JSON.stringify({
                '@appname': config.API_NAME,
                '@servername': os.hostname(),
                '@serverip': address.address,
                '@env': process.env.NODE_ENV,
                '@timestamp': moment().toISOString(),
                event: 'TBD',
                ...data,
            })
        }

        return {
            request(data: object) {
                requestLogger.info(mergeData(data))
            },
            debug(data: object) {
                commonLogger.debug(mergeData(data))
            },
            info(data: object) {
                commonLogger.info(mergeData(data))
            },
            warn(data: object) {
                commonLogger.warn(mergeData(data))
            },
            error(data: object) {
                commonLogger.error(mergeData(data))
            },
            fatal(data: object) {
                commonLogger.fatal(mergeData(data))
            },
        }
    },
}
