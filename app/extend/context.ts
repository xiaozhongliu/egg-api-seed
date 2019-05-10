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
                '@env': process.env.SERVER_ENV || 'local',
                '@region': process.env.REGION || 'unknown',
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
            debug(data: object) {
                commonLogger.debug(mergeData(data), LogLevel.DEBUG)
            },
            info(data: object) {
                commonLogger.info(mergeData(data), LogLevel.INFO)
            },
            warn(data: object) {
                commonLogger.warn(mergeData(data), LogLevel.WARN)
            },
            error(data: object) {
                commonLogger.error(mergeData(data), LogLevel.ERROR)
            },
            fatal(data: object) {
                commonLogger.fatal(mergeData(data), LogLevel.FATAL)
            },
        }
    },
}
