import { Controller } from 'egg'

export default class GreeterController extends Controller {

    public async sayHello() {
        const { ctx } = this
        ctx.body = await ctx.service.greeter.sayHello('test')
    }

    public async sayGoodbye() {
        const { ctx } = this
        ctx.body = await ctx.service.greeter.sayGoodbye('test')
    }
}
