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
    bang :Tock   // tock zero

    constructor(path :string) {
        this.rock = new Rock(path)
        this.tree = new Tree(this.rock)
        this.bang = [
            h2b('00'.repeat(24)),
            h2b('00'.repeat(24)),
            h2b('00'.repeat(7)),
            h2b('00'.repeat(7)),
        ]
        let bangroll = roll(this.bang)
        let banghash = mash(bangroll)
        this.tree.grow(h2b(''), (rite,twig,snap) => {
            rite.etch(rkey('best'), banghash)
            rite.etch(rkey('tock', banghash), bangroll)
            console.log('djin init etch tock', banghash, bangroll)
            rite.etch(rkey('work', banghash), n2b(tuff(bangroll)))
            rite.etch(rkey('fold', banghash, n2b(BigInt(0))), roll([snap, n2b(BigInt(0))]))
        })
    }

    // ['ask/tocks tailhash ]  ->  'say/tocks tocks
    // ['ask/tocks Mash     ]  ->  'say/tocks Tock[]
    _ask_tocks(memo :Memo) :Memo {
        // todo need tail in history
        let [line, body] = memo;
        let tail = body as Blob
        let lead = []
        let best = this.rock.read_one(rkey('best'))
        let prev = best as unknown as Blob // mash
        console.log('prev', prev)
        let banghash = mash(roll(this.bang))
        do {
            console.log('reading prev', prev)
            console.log(this.rock._db)
            let blob = this.rock.read_one(rkey('tock', prev))
            if (blob.length == 0) {
                toss(`no such tock: ${prev}`)
            } else {
                let tock = unroll(blob) as Tock
                lead.push(tock)
                prev = tock[0] // tock.prev
            }
        } while( !bleq(prev, tail) && !bleq(prev, banghash) && !bleq(prev, h2b('00'.repeat(24))) )
        return [t2b('say/tocks'), lead] as Memo
    }

    // 'say/tocks Tock[]  ->  'ask/tocks tock:Mash
    //                    ->  'ask/tacks tock:Mash,i:num
    _say_tocks(memo :Memo) :Memo {
        let [line, body] = memo
        aver(_=>body.length == 1, `panic, djin memo is not split into units`)
        let tocks = body as Tock[]
        // aver prev is possibly-valid
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
