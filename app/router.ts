import { Application } from 'egg'

export default (app: Application) => {

    let rp
    const { controller, router } = app
    router.get('/', controller.home.index)
    router.get('/grpc', controller.home.grpc)
    router.get('/header', controller.home.header)
    router.get('/timeout', controller.home.timeout)
    router.get('/failover', controller.home.failover)
    router.get('/pause', controller.home.pause)
    router.get('/eatmem', controller.home.eatmem)
    router.get('/getmem', controller.home.getmem)
    router.get('/eatcpu', controller.home.eatcpu)
    router.get('/getcpu', controller.home.getcpu)

    rp = app.router.namespace('/greeter')
    rp.get('/sayHello', controller.greeter.sayHello)
    rp.get('/sayGoodbye', controller.greeter.sayGoodbye)
}
