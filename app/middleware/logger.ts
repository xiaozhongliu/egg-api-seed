import { Application, Context } from 'egg'
import moment from 'moment'
import 'moment/locale/zh-cn'

export default (app: Application) => {
    return async (ctx: Context, next: Function) => {
        const start = moment()

        await next()

        const end = moment()
        ctx.log4js.request({
            controller: ctx.routerName,
            '@duration': end.diff(start, 'milliseconds'),
        })
    }
}
