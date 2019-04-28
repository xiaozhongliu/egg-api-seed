import { Enum } from '../../typings/custom/enum'

class TypeMapping extends Enum {
    bool = 'boolean'
    int32 = 'number'
    double = 'number'
}

export default {
    TypeMapping: new TypeMapping(),
}
