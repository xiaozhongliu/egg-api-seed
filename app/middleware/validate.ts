import { Context } from 'egg'

export default async (ctx: Context, next: Function) => {
    console.log('enter midware')
    console.log(JSON.stringify(ctx))
    await next()
    console.log('exit midware')
    console.log(JSON.stringify(ctx))
}
