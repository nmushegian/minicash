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

    read(memo :Memo) :Okay<Memo> {
        let [line, body] = memo
        try { switch (line.toString()) {
            case 'ask/tocks': {
                let init = body as Mash; // tockhash
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
            case 'ask/tacks': {
                toss(`todo`)
            }
            case 'ask/ticks': {
                toss(`todo`)
            }
            default: return fail(`panic/unrecognized memo line ${line}`)
        } } catch (e) {
            toss(`engine panic: ${e.message}`)
        }
    }

    turn(memo :Memo, skip : any = { 'skip_form': false, 'skip_vinx': false }) :Okay<Memo> {
        try {
            let [line, body] = memo
            switch (line.toString()) {

                case 'say/tocks': {
                    let tocks = body as Tock[]
                    if (!skip.skip_form) {
                        tocks.forEach(tock => okay(form_tock(tock)))
                    }
                    if (!skip.skip_vinx) {
                        tocks.forEach(tock => {
                            let prevhash = tock[0]
                            let prevtock = this.tree.read_rock(rkey('tock', prevhash))
                            okay(vinx_tock(prevtock as Tock, tock))
                            this.tree.etch_rock(rkey('tock', mash(roll(tock))), tock)
                        })
                    }
                    for (let tock of tocks) {
                        vult_thin(this.tree, tock)
                        //vult_part() ?  -> ask/tacks
                        //vult_full() ?  -> ask/ticks
                    }
                    toss(`todo say/tocks`)
                }

                case 'say/tacks': {
                    // ...
                    // tack_form
                    // tack_vinx
                    // rock.etch
                    // outs << vult_part
                    // outs << vult_full
                    // send outs
                }

                case 'say/ticks': {
                    // ...
                    // tick_form
                    // tick_vinx
                    // rock.etch
                    // later, do something smarter to know what vult to retry
                    // for now, dumb sync will retry from ask/tocks
                }

                default: return fail(`unrecognized turn line: ${line}`)
            }
        } catch(e) {
            toss(`engine panic: ${e.message}`)
        }
    }

    async *_spin(memo, skip?) {
        while (true) {
            let [oki, back, ierr] = this.turn(memo, skip)
            let [oko, refl, oerr] = this.turn(back, skip)
            if (refl) {
                memo = refl
                yield
            } else {
                return back
            }
        }
    }

    async spin(memo, skip?) {
        let back
        for await (back of this._spin(memo, skip))
        { continue }
        return back
    }

}
