import { Application, Context } from 'egg'
import log4js from 'log4js'

let logger: any

export default (app: Application) => {
    return async (ctx: Context, next: Function) => {
        await next()
        if (!logger) {
            logger = ctx.log4js()
        }
        logger.info({ controller: ctx.routerName })
    }
}
