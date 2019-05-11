import assert from 'assert'
import { Context } from 'egg'
import { app } from 'egg-mock/bootstrap'

describe('app/service/greeter', () => {
    let ctx: Context

    before(async () => {
        ctx = app.mockContext()
    })

    it('sayHello', async () => {
        const result = await ctx.service.greeter.sayHello('world')
        assert.equal(result.message, 'Hello world')
    })
})
