import { Service } from 'egg'

export default class Greeter extends Service {

    readonly service: GreeterService = this.app.grpcClient.main.greeter.Greeter

    public async sayHello(name: string) {
        return this.service.sayHello({ name }, this.ctx.grpcmeta)
    }

    public async sayGoodbye(name: string) {
        return this.service.sayGoodbye({ name }, this.ctx.grpcmeta)
    }
}
