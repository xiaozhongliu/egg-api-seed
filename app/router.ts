import { Application } from 'egg'

export default (app: Application) => {

    let rp
    const { validate } = app.middleware
    const { controller, router } = app

    router.get('HomeController.index', '/', validate, controller.home.index)
    router.get('HomeController.validate', '/validate', validate, controller.home.validate)
    router.get('HomeController.grpc', '/grpc', validate, controller.home.grpc)
    router.get('HomeController.header', '/header', validate, controller.home.header)
    router.get('HomeController.timeout', '/timeout', validate, controller.home.timeout)
    router.get('HomeController.failover', '/failover', validate, controller.home.failover)
    router.get('HomeController.pause', '/pause', validate, controller.home.pause)
    router.get('HomeController.eatmem', '/eatmem', validate, controller.home.eatmem)
    router.get('HomeController.getmem', '/getmem', validate, controller.home.getmem)
    router.get('HomeController.eatcpu', '/eatcpu', validate, controller.home.eatcpu)
    router.get('HomeController.getcpu', '/getcpu', validate, controller.home.getcpu)

    rp = app.router.namespace('/greeter')
    rp.get('GreeterController.sayHello', '/sayHello', validate, controller.greeter.sayHello)
    rp.get('GreeterController.sayGoodbye', '/sayGoodbye', validate, controller.greeter.sayGoodbye)
}
