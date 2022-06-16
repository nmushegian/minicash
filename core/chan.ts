export { Chan }

import {
    Memo,
    h2b,
} from './word.js'

class Chan {
    async send(x :Memo) {}
    async recv() :Promise<Memo> { return [h2b(''), []] }
}
