import { IsOptional, Length, Min, Max, IsBoolean } from 'class-validator'

export default class IndexRequest {
    @Length(4, 8)
    @IsOptional()
    foo: string

    @Min(5)
    @Max(10)
    @IsOptional()
    bar: number

    @IsBoolean()
    @IsOptional()
    baz: boolean
}
