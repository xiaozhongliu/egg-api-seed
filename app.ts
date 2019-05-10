import os from 'os'
import { Application } from 'egg'

export default class AppBootHook {

    private app: Application

    constructor(app: Application) {
        this.app = app
    }

    async didReady() {
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
    }
}
