// engine

import {
    Okay, okay, pass, fail, toss, aver,
    b2h, h2b,
    roll,
    Tock,
    Mash, mash,
    Memo
} from './word.js'

import { Rock } from './rock.js'
import { Tree } from './tree.js'

export { Djin }

class Djin {
    rock :Rock   // content-addressed values
    tree :Tree   // per-tock view of state

    constructor(rock :Rock) {
        this.rock = rock
        this.tree = new Tree(this.rock)
        // sync tree from rock
    }

    read(memo :Memo) :Okay<Memo> {
        let [line, body] = memo
        try { switch (line.toString()) {
            case 'ask/tocks': {
                toss(`todo`)
                return pass([Buffer.from('say/tocks'), []])
            }
            case 'ask/tacks': {
                toss(`todo`)
            }
            case 'ask/ticks': {
                toss(`todo`)
            }
            default: toss(`panic/unrecognized memo line ${line}`)
        } } catch (e) {
            return fail(e.reason)
        }
    }

    turn(memo :Memo) :Okay<Memo> {
        let [line, body] = memo

        try { switch (line.toString()) {
            case 'say/tocks': {
                // ...
                // tock_form
                // tock_vinx
                // rock.etch
                // outs << vult_thin
                // send outs
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
            default: toss(`unrecognized mail line: ${line}`)
        } } catch(e) {
            return fail(e.message)
        }
    }

    // todo no null return when use result type...
    async *spin(memos :Memo[]) : AsyncGenerator<null, Okay<Memo>, null> {
        for (let memo of memos) {
            let next = memo
            while (true) {
                // try to answer yourself first
                let refl = this.turn(next)
                let [ok, v, e] = refl
                if (ok) {
                    let _next = this.turn(okay(refl))
                    aver(_=>okay(_next), `panic, self-reply not okay`)
                    next = okay(_next)
                    yield
                    continue
                } else {
                    return refl
                }
            }
            yield
        }
    }

    leads(k) :Tock[][] {throw new Error()} // set of possibly-valid leads
    best() :Tock {throw new Error()} // best definitely-valid tock
    tail() :Tock {throw new Error()} // finalized trail
}
