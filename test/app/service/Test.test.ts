import assert from 'assert'
import { Context } from 'egg'
import { app } from 'egg-mock/bootstrap'

describe('test/app/service/demo.test.js', () => {
    let ctx: Context

    before(async () => {
        ctx = app.mockContext()
    })

    it('sayHi', async () => {
        const result = await ctx.service.demo.sayHi('egg')
        assert(result === 'hi, egg')
    })
})
