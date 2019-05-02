import { Application, Context } from 'egg'

module.exports = (options: any, app: Application) => {
    return async (ctx: Context, next: Function) => {
        console.log('enter midware')
        await next()
        console.log('exit midware')
    }
}
