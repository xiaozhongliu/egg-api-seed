import { Service } from 'egg'

export default class Demo extends Service {

    public async sayHi(name: string) {
        return `hi, ${name}`
    }
}
