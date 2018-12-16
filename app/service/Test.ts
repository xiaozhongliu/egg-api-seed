import { Service } from 'egg'

export default class Test extends Service {

    public async sayHi(name: string) {
        return `hi, ${name}`
    }
}
