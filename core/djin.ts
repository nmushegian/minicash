// engine

import {
    Okay, pass, fail, toss,
    b2h, h2b,
    roll,
    Mash, mash,
    Memo
} from './word.js'

import { Rock } from './rock.js'
import { Tree } from './tree.js'

export { Djin }

class Djin {
    best :Mash   // best definitely-valid tock (cumulative work)
    race :Mash[] // top K possibly-valid tocks (cumulative work)
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

    turn(memo :Memo) :Okay<Memo[]> {
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

    async *spin(mails:Memo[]) :AsyncGenerator<Okay<Memo[]>, null, void> {
        for (let mail of mails) {
            yield this.turn(mail)
        }
        return null
    }
}
