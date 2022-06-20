// engine

import {
    Okay, okay, pass, fail, toss, aver,
    b2h, h2b, t2b, b2t,
    Blob, isblob,
    roll, unroll, bleq, islist,
    Tock,
    Mash, mash,
    Memo
} from './word.js'

import {
    Chan
} from './chan.js'

// todo well task
import {
    form_tock,
} from './well.js'

// todo vinx task
import {
    vinx_tock
} from './vinx.js'

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
        let banghash = mash(roll(this.bang()))
        this.rock.rite(r => {
            r.etch(rkey('best'), banghash)
            r.etch(rkey('tock', banghash),  roll(this.bang()))
        })
    }

    bang() {
        return [
            h2b('00'.repeat(24)),
            h2b('00'.repeat(24)),
            h2b('00'.repeat(7)),
            h2b('00'.repeat(7)),
        ]
    }

    // todo memo type param
    // Mash -> Tock[]
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
              && !bleq(prev, mash(roll(this.bang())))
              && !bleq(prev, h2b('00'.repeat(24))) )
        return [t2b('say/tocks'), lead] as Memo
    }

    // djin precondition is to split tocks across spin
    // TODO be more consistent about all this
    _say_tocks(memo :Memo) :Memo {
        let [line, body] = memo
        let tock = body as Tock

        aver(_=>b2t(line) == 'say/tocks', `say/tocks line must match`)
        if (true) { //!this.skip_form
            okay(form_tock(tock))
        }
        if (true) { //!this.skip_vinx
            let prevhash = tock[0]
            let prevtock = unroll(this.rock.read_one(rkey('tock', prevhash)))
            okay(vinx_tock(prevtock as Tock, tock))
        }

        // if fullmode, require prev know is definitely-valid
        vult_thin(this.tree, tock)
        // ask/tocks from here if know valid
        // vult_full(this.tree, tock)
        // ask/tacks for this tock if dont know
        throw new Error(`todo _say_tocks`)
    }

    read(memo :Memo) :Okay<Memo> {
        let [line, body] = memo
        try { switch (line.toString()) {
            case 'ask/tocks': {
                return pass(this._ask_tocks(memo))
            }
            case 'ask/tacks': {
                toss(`todo djin read ask/tacks`)
            }
            case 'ask/ticks': {
                toss(`todo djin read ask/ticks`)
            }
            default: return fail(`panic/unrecognized memo line ${line}`)
        } } catch (e) {
            toss(`engine panic: ${e.message}`)
        }
    }

    turn(memo :Memo) :Okay<Memo> {
        try {
            let [line, body] = memo
            switch (line.toString()) {
                case 'say/tocks': {
                    // aver tocks len 1
                    // spin splits up messages into units
                    return pass(this._say_tocks(memo))
                    // ret ask/tacks if we need tacks
                    //     ask/tocks if we can proceed
                }

                case 'say/tacks': {
                    // ...
                    // tack_form
                    // tack_vinx
                    // vult_full
                    //   ask/ticks if we need ticks
                    //   ask/tacks if we need next tack
                    //   ask/tocks if we can make progress
                    toss(`todo turn say/tacks`)
                }

                case 'say/ticks': {
                    // ...
                    // tick_form
                    // tick_vinx
                    // rock etch
                    //   say/ticks to rebroadcast
                    toss(`todo turn say/ticks`)
                }
                default: return fail(`unrecognized turn line: ${line}`)
            }
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
