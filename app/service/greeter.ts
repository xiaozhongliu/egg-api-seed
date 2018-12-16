import { Service } from 'egg'

export default class Greeter extends Service {

    readonly service = this.app.grpcClient.get('default').greeter.Greeter

    public async sayHello(message: string) {
        return this.service.sayHello(message)
    }

    public async sayGoodbye(message: string) {
        return this.service.sayGoodbye(message)
    }
}
