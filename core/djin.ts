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

    async *_spin(next :Memo) : AsyncGenerator<void, Memo, void> {
        while (true) {
            let back = okay(this.turn(next))
            let [have, miss, errs] = this.turn(back)
            if (have) {
                next = okay(this.turn(miss))
                yield
            } else {
                return miss
            }
        }
        toss(`unreachable`)
    }

    async *spin(memos :Memo[]) : AsyncGenerator<Memo, void, void> {
        for (let memo of memos) {
            let miss
            for await (miss of this._spin(memo))
            { continue }
            yield miss
        }
    }

    leads(k) :Tock[][] {throw new Error()} // set of possibly-valid leads
    best() :Tock {throw new Error()} // best definitely-valid tock
    tail() :Tock {throw new Error()} // finalized trail
}
