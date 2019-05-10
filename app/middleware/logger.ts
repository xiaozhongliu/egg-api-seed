import { Application, Context } from 'egg'
import moment from 'moment'
import 'moment/locale/zh-cn'

export default (app: Application) => {
    return async (ctx: Context, next: Function) => {
        const start = moment()
        await next()
        const end = moment()

        const { log4js, request, response } = ctx
        log4js.request({
            '@duration': end.diff(start, 'milliseconds'),
            '@clientip': request.headers['x-forwarded-for'],
            controller: ctx.routerName,
            method: request.method,
            url: request.url,
            metedata: request.headers,
            request: {
                query: request.query,
                body: request.body,
            },
            response: ctx.body,
            status: response.status,
        })
    }
}
