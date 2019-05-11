import { Application } from 'egg'

export default (app: Application) => {

    let rp
    const { validate } = app.middleware
    const { controller, router } = app

    router.get('Home.index', '/', validate, controller.home.index)
    router.get('Home.validate', '/validate', validate, controller.home.validate)
    router.get('Home.grpc', '/grpc', validate, controller.home.grpc)
    router.get('Home.header', '/header', validate, controller.home.header)
    router.get('Home.timeout', '/timeout', validate, controller.home.timeout)
    router.get('Home.failover', '/failover', validate, controller.home.failover)
    router.get('Home.pause', '/pause', validate, controller.home.pause)
    router.get('Home.eatmem', '/eatmem', validate, controller.home.eatmem)
    router.get('Home.getmem', '/getmem', validate, controller.home.getmem)
    router.get('Home.eatcpu', '/eatcpu', validate, controller.home.eatcpu)
    router.get('Home.getcpu', '/getcpu', validate, controller.home.getcpu)

    rp = app.router.namespace('/greeter')
    rp.get('Greeter.sayHello', '/sayHello', validate, controller.greeter.sayHello)
    rp.get('Greeter.sayGoodbye', '/sayGoodbye', validate, controller.greeter.sayGoodbye)
}
