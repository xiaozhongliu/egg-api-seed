import { Application, Context } from 'egg'
import { Metadata } from 'grpc'

export default (app: Application) => {
    return async (ctx: Context, next: Function) => {
        ctx.grpcmeta = new Metadata();
        [
            'x-request-id',
            'x-b3-traceid',
            'x-b3-spanid',
            'x-b3-parentspanid',
            'x-b3-sampled',
            'x-b3-flags',
            'x-ot-span-context',
        ].forEach(item => {
            if (ctx.headers[item]) {
                ctx.grpcmeta.add(item, ctx.headers[item])
            }
        })
        return next()
    }
}
