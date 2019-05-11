import { Context } from 'egg'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'

import HomeIndexRequest from '../request/home/IndexRequest'
import HomeValidateRequest from '../request/home/ValidateRequest'
const typeMap = new Map([
    ['Home.index', HomeIndexRequest],
    ['Home.validate', HomeValidateRequest],
])

export default async (ctx: Context, next: Function) => {
    const type = typeMap.get(ctx.routerName)
    const target = plainToClass(type, ctx.query)
    const errors = await validate(target)

    if (!errors.length) return next()

    ctx.body = {
        success: false,
        message: errors.map(error => ({
            field: error.property,
            prompt: error.constraints,
        })),
    }
}
