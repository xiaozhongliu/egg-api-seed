import { Controller } from 'egg'
import os from 'os-utils'

global.arr = []

export default class HomeController extends Controller {

    public async index() {
        const { app, ctx, config } = this
        ctx.body = {
            AppName: config.appName,
            Version: config.appVersion,
            ServerEnv: process.env.SERVER_ENV,
            ServerName: app.serverInfo.serverName,
            ServerIP: app.serverInfo.serverIP,
        }
    }

    public async validate() {

    }

    public async grpc() {
        const { ctx } = this
        ctx.body = await ctx.service.greeter.sayHello('world')
    }

    public async header() {
        const { ctx } = this
        ctx.body = ctx.headers
    }

    public async timeout() {
        const { ctx } = this
        await (new Promise(resolve => {
            setTimeout(resolve, 5000)
        }))
        ctx.body = 'bingo'
    }

    public async failover() {
        const { ctx } = this
        if (Math.random() > 0.5) {
            ctx.body = 'bingo'
        } else {
            ctx.status = 500
        }
    }

    public async pause() {
        const { ctx } = this
        global.paused = true
        ctx.body = 'done'
    }

    public async eatmem() {
        const { ctx } = this
        if (ctx.query.slowly) {
            global.paused = false
            eatmem()
        } else {
            for (let i = 0; i < 10485760; i++) { global.arr.push('a') }
        }
        ctx.body = 'done'
    }

    public async getmem() {
        const { ctx } = this
        const usage = process.memoryUsage()
        ctx.body = {
            rss: usage.rss / 1024 / 1024,
            heapTotal: usage.heapTotal / 1024 / 1024,
            heapUsed: usage.heapUsed / 1024 / 1024,
            external: usage.external / 1024 / 10246,
        }
    }

    public async eatcpu() {
        const { ctx } = this
        global.paused = false
        let result = 0
        while (!global.paused) {
            result += Math.random() * Math.random()
        }
        ctx.body = result
    }

    public async getcpu() {
        const { ctx } = this
        const usage: number = await new Promise(resolve => os.cpuFree(resolve))
        ctx.body = Number(usage.toFixed(2)) * 100
    }
}

function eatmem() {
    if (global.paused) { return }

    for (let i = 0; i < 16384; i++) { global.arr.push('a') }
    setTimeout(eatmem, 200)
}
