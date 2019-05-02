import { Application } from 'egg'

export default (app: Application) => {

    let rp
    const { validate } = app.middleware
    const { controller, router } = app

    router.get('home.index', '/', validate, controller.home.index)
    router.get('home.validate', '/validate', validate, controller.home.validate)
    router.get('home.grpc', '/grpc', validate, controller.home.grpc)
    router.get('home.header', '/header', validate, controller.home.header)
    router.get('home.timeout', '/timeout', validate, controller.home.timeout)
    router.get('home.failover', '/failover', validate, controller.home.failover)
    router.get('home.pause', '/pause', validate, controller.home.pause)
    router.get('home.eatmem', '/eatmem', validate, controller.home.eatmem)
    router.get('home.getmem', '/getmem', validate, controller.home.getmem)
    router.get('home.eatcpu', '/eatcpu', validate, controller.home.eatcpu)
    router.get('home.getcpu', '/getcpu', validate, controller.home.getcpu)

    rp = app.router.namespace('/greeter')
    rp.get('greeter.sayHello', '/sayHello', validate, controller.greeter.sayHello)
    rp.get('greeter.sayGoodbye', '/sayGoodbye', validate, controller.greeter.sayGoodbye)
}
