// engine

import {
    Okay, okay, pass, fail, toss, aver,
    b2h, h2b, t2b,
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
        this.tree.etch_rock(rkey('best'), banghash)
        this.tree.etch_rock(rkey('tock', banghash), this.bang())
    }

    bang() {
        return [
            h2b('00'.repeat(24)),
            h2b('00'.repeat(24)),
            h2b('00'.repeat(7)),
            h2b('00'.repeat(7)),
        ]
    }
    tail() {
        return []
    }

    _ask_tocks(init :Mash) :Okay<Tock[]> {
        // todo need init in history
        let best = this.tree.read_rock(rkey('best'))
        let lead = []
        aver(_=>isblob(best), `best in db must be a blob`)
        let prev = best as unknown as Blob // mash
        do {
            let roll = this.tree.read_rock(rkey('tock', prev))
            if (roll.length == 0) {
                return fail(`no such tock: ${prev}`)
            } else {
                let tock = roll as Tock
                lead.push(tock)
                prev = tock[0] // tock.prev
            }
        } while( !bleq(prev, init)
            && !bleq(prev, mash(roll(this.bang())))
            && !bleq(prev, h2b('00'.repeat(24))) )
        return pass([t2b('say/tocks'), lead])
    }

    read(memo :Memo) :Okay<Memo> {
        let [line, body] = memo
        try { switch (line.toString()) {
            case 'ask/tocks': {
                return okay(this._ask_tocks(body as Mash))
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
                    let tock = body[0] as Tock
                    if (true) { //!this.skip_form
                        okay(form_tock(tock))
                    }
                    if (true) { //!this.skip_vinc
                        let prevhash = tock[0]
                        let prevtock = this.tree.read_rock(rkey('tock', prevhash))
                        okay(vinx_tock(prevtock as Tock, tock))
                    }
                    vult_thin(this.tree, tock)
                    // ask/tocks from here if know valid
                    // ask/tacks for this tock if dont know valid
                    toss(`todo say/tocks`)
                }

                case 'say/tacks': {
                    // ...
                    // tack_form
                    // tack_vinx
                    // vult_part
                    //   ask/ticks if we need ticks
                    //   ask/tacks if we need next tack
                    //   ask/tocks if we can make progress
                    toss(`todo turn say/tacks`)
                }

                case 'say/ticks': {
                    // ...
                    // tick_form
                    // tick_vinx
                    //   say/ticks to rebroadcast
                    // later, do something smarter to know what vult to retry
                    // for now, dumb sync will retry from ask/tocks
                    toss(`todo turn say/ticks`)
                }
                default: return fail(`unrecognized turn line: ${line}`)
            }
        } catch(e) {
            toss(`engine panic: ${e.message}`)
        }
    }

    async *spin(memo) {
        // split up memo into units
        // turn/reflect/yield one at a time
    }

}
