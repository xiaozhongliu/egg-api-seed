import assert from 'assert'
import { app } from 'egg-mock/bootstrap'

describe('app/controller/home', () => {
    it('index', async () => {
        const result = await app.httpRequest().get('/').expect(200)
        assert.equal(result.body.AppName, app.name)
    })
})
