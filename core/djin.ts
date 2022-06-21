// engine

import {
    Okay, okay, pass, fail, toss, aver,
    h2b, t2b, b2t,
    Blob, isblob,
    roll, unroll, bleq, islist,
    Tock, tuff, n2b,
    Mash, mash,
    Memo
} from './word.js'

import {
    vult_thin
} from './vult.js'

import { Rock } from './rock.js'
import { Tree, rkey } from './tree.js'

export { Djin }

class Djin {
    rock :Rock   // content-addressed values
    tree :Tree   // per-tock view of state

    constructor(path :string) {
        this.rock = new Rock(path)
        this.tree = new Tree(this.rock)
        let zero = roll(this.tree.bang)
        let zerohash = h2b('00'.repeat(24))
        this.tree.grow(h2b(''), (rock,twig,snap) => {
            rock.etch(rkey('best'), zerohash)
            rock.etch(rkey('tock', zerohash), zero)
            rock.etch(rkey('work', zerohash), n2b(tuff(zero)))
            rock.etch(rkey('fold', zerohash, n2b(BigInt(0))), roll([snap, n2b(BigInt(0))]))
        })
    }

    // 'ask/tocks Tosh[]  ->  'say/tocks Tock[]
    _ask_tocks(memo :Memo) :Memo {
        // todo need init in history
        let [line, body] = memo;
        let init = body as Blob
        let lead = []
        let best = this.rock.read_one(rkey('best'))
        let prev = best as unknown as Blob // mash
        do {
            let blob = this.rock.read_one(rkey('tock', prev))
            if (blob.length == 0) {
                toss(`no such tock: ${prev}`)
            } else {
                let tock = unroll(blob) as Tock
                lead.push(tock)
                prev = tock[0] // tock.prev
            }
        } while( !bleq(prev, init)
              && !bleq(prev, h2b('00'.repeat(24))) )
        return [t2b('say/tocks'), lead] as Memo
    }

    // 'say/tocks Tock[]  ->  'ask/tocks tock
    //                    ->  'ask/tacks tock,i
    _say_tocks(memo :Memo) :Memo {
        let [line, body] = memo
        aver(_=>body.length == 1, `panic, djin memo is not split into units`)
        let tocks = body as Tock[]
        let thinmemo = vult_thin(this.tree, tocks[0])
//        let fullmemo = vult_full(this.tree, tock)
        return thinmemo
    }

    read(memo :Memo) :Okay<Memo> {
        try {
            let line = b2t(memo[0])
            if ('ask/tocks' == line) {
                // -> say/tocks | err
                return pass(this._ask_tocks(memo))
            }
            if ('ask/tacks' == line) {
                // -> say/tacks | err
                toss(`todo djin read ask/tacks`)
            }
            if ('ask/ticks' == line) {
                // -> say/ticks | err
                toss(`todo djin read ask/ticks`)
            }
            return fail(`panic/unrecognized memo line ${line}`)
        } catch (e) {
            toss(`engine panic: ${e.message}`)
        }
    }

    turn(memo :Memo) :Okay<Memo> {
        try {
            let line = b2t(memo[0])
            if ('say/tocks' == line) {
                // -> ask/tocks    proceed
                // -> ask/tacks    need tacks
                // -> err
                return pass(this._say_tocks(memo))
            }
            if ('say/tocks' == line) {
                // -> ask/tocks    proceed
                // -> ask/tacks    proceed
                // -> ask/ticks    need ticks
                // return pass(this._say_tacks(memo)
                toss(`todo turn say/tacks`)
            }
            if ('say/tocks' == line) {
                // -> say/ticks    accept/rebroadcast
                // -> err
                toss(`todo turn say/ticks`)
            }
            return fail(`unrecognized turn line: ${line}`)
        } catch(e) {
            toss(`engine panic: ${e.message}`)
        }
    }

    async *spin(memo) {
        // aver well-formed
        // aver valid-in-context
        // split up memo into units
        // turn/reflect/yield one at a time
    }

}
