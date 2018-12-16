import { Application } from 'egg'

export default (app: Application) => {

    const { controller, router } = app
    router.get('/', controller.home.index)

    const rp = app.router.namespace('/greeter')
    rp.get('/sayHello', controller.greeter.sayHello)
    rp.get('/sayGoodbye', controller.greeter.sayGoodbye)
}
