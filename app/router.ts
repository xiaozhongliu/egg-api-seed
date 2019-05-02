import { Application } from 'egg'

export default (app: Application) => {

    let rp
    const { controller, router } = app
    router.get('home.index', '/', controller.home.index)
    router.get('home.validate', '/validate', controller.home.validate)
    router.get('home.grpc', '/grpc', controller.home.grpc)
    router.get('home.header', '/header', controller.home.header)
    router.get('home.timeout', '/timeout', controller.home.timeout)
    router.get('home.failover', '/failover', controller.home.failover)
    router.get('home.pause', '/pause', controller.home.pause)
    router.get('home.eatmem', '/eatmem', controller.home.eatmem)
    router.get('home.getmem', '/getmem', controller.home.getmem)
    router.get('home.eatcpu', '/eatcpu', controller.home.eatcpu)
    router.get('home.getcpu', '/getcpu', controller.home.getcpu)

    rp = app.router.namespace('/greeter')
    rp.get('greeter.sayHello', '/sayHello', controller.greeter.sayHello)
    rp.get('greeter.sayGoodbye', '/sayGoodbye', controller.greeter.sayGoodbye)
}
