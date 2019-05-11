import os from 'os'
import { Application } from 'egg'

export default class AppBootHook {

    private app: Application

    constructor(app: Application) {
        this.app = app
    }

    async willReady() {
        // get server instances ip address
        const networksOrigin = os.networkInterfaces()
        const networks =
            networksOrigin.eth0 ||
            networksOrigin.eth1 ||
            networksOrigin.en0 ||
            networksOrigin.en1 ||
            networksOrigin.本地连接
        const info = networks.find(network => network.family === 'IPv4')

        this.app.serverInfo = {
            serverName: os.hostname(),
            serverIP: info.address,
        }

        if (!process.env.SERVER_ENV) process.env.SERVER_ENV = 'local'
        if (!process.env.REGION) process.env.REGION = 'unknown'
    }

    async didReady() {
        const ctx = await this.app.createAnonymousContext()
        await ctx.log4js.info(`env is: ${process.env.SERVER_ENV}`)
    }
}
