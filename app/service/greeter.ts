import { Service } from 'egg'

export default class Greeter extends Service {

    readonly service: GreeterService = this.app.grpcClient.get('default').greeter.Greeter

    public async sayHello(name: string) {
        return this.service.sayHello({ name })
    }

    public async sayGoodbye(name: string) {
        return this.service.sayGoodbye({ name })
    }
}
