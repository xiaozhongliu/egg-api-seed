import { Enum } from '../../typings/custom/enum'

class TypeMapping extends Enum {
    int32 = 'number'
    double = 'number'
}

export default {
    TypeMapping: new TypeMapping(),
}
