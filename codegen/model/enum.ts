import { Enum } from '../../typings/enum'

class TypeMapping extends Enum {
    int32 = 'number'
    double = 'number'
}

export default {
    TypeMapping: new TypeMapping(),
}
