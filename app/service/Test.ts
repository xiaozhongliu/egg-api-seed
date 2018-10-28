import { Service } from 'egg'

export default class Test extends Service {

    /**
     * say hi to you
     * @param name - your name
     */
    public async sayHi(name: string) {
        return `hi, ${name}`
    }
}
