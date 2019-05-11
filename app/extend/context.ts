import log4js from 'log4js'
import moment from 'moment'
import 'moment/locale/zh-cn'
import LogLevel from '../enum/log-level'
import { Application, EggAppConfig } from 'egg'

export default {

    get log4js() {
        const app: Application = this.app
        if (app.customLogger) return app.customLogger

        const config: EggAppConfig = app.config
        const layout = { type: 'pattern', pattern: '%m' }
        const commonLevel = config.DEBUG ? 'debug' : 'info'
        const appenders: any = {
            common: getAppender('common'),
            request: getAppender('request'),
        }
        const categories = {
            default: { appenders: ['common'], level: commonLevel },
            request: { appenders: ['request'], level: 'info' },
        }
        // output logs to console in debug mode
        if (config.DEBUG) {
            appenders.console = { type: 'console', category: 'common', layout }
            categories.default.appenders.push('console')
        }

        log4js.configure({
            appenders,
            categories,
            disableClustering: true,
        })
        const commonLogger = log4js.getLogger('common')
        const requestLogger = log4js.getLogger('request')

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

        function mergeData(data: object, level?: LogLevel) {
            return JSON.stringify({
                '@env': process.env.SERVER_ENV,
                '@region': process.env.REGION,
                '@servername': app.serverInfo.serverName,
                '@serverip': app.serverInfo.serverIP,
                '@timestamp': moment().toISOString(),
                level: level,
                ...data,
            })
        }

        return app.customLogger = {
            request(data: object) {
                requestLogger.info(mergeData(data))
            },
            debug(data: string | object) {
                const dataObj = typeof data === 'string' ? { message: data } : data
                commonLogger.debug(mergeData(dataObj, LogLevel.DEBUG))
            },
            info(data: string | object) {
                const dataObj = typeof data === 'string' ? { message: data } : data
                commonLogger.info(mergeData(dataObj, LogLevel.INFO))
            },
            warn(data: string | object) {
                const dataObj = typeof data === 'string' ? { message: data } : data
                commonLogger.warn(mergeData(dataObj, LogLevel.WARN))
            },
            error(data: string | object) {
                const dataObj = typeof data === 'string' ? { message: data } : data
                commonLogger.error(mergeData(dataObj, LogLevel.ERROR))
            },
            fatal(data: string | object) {
                const dataObj = typeof data === 'string' ? { message: data } : data
                commonLogger.fatal(mergeData(dataObj, LogLevel.FATAL))
            },
        }
    },
}
