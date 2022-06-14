
// engine

import {
    Okay, pass, fail, toss,
    b2h, h2b,
    blob, roll,
    Mash, mash,
    Mail
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

        let tickzero = [[],[]]     // degenerate transaction
        let tockzero = [
            h2b('00'.repeat(24)), // seed0
            mash(roll(tickzero)),  // merkle root
            h2b('00'.repeat(7)),  // timestamp
            h2b('00'.repeat(7))   // seed1
        ]
        //this.rock.tick_add(tickzero)
        //this.rock.tock_add(tockzero)
        //vult_full(this.rock, this.tree, this.tockzero, [this.tickzero])
    }

    turn(mail :Mail) :Okay<Mail[]> {
        let [line, body] = mail

        try { switch (line.toString()) {

            case 'ann/ticks': {
                // relay if valid-in-context with > relay fee
                // rock.etch(tick)
                toss(`todo`)
            }

            case 'ask/tocks': {
                // query
                toss(`todo`)
            }
            case 'ask/tacks': {
                // query
                toss(`todo`)
            }
            case 'ask/ticks': {
                // query
                toss(`todo`)
            }

            case 'res/tocks': {
                // ...
                // tock_form
                // tock_vinx
                // rock.etch
                // outs << vult_thin
                // send outs
            }
            case 'res/tacks': {
                // ...
                // tack_form
                // tack_vinx
                // rock.etch
                // outs << vult_part
                // outs << vult_full
                // send outs
            }
            case 'res/ticks': {
                // ...
                // tick_form
                // tick_vinx
                // rock.etch
                // later, do something smarter to know what vult to retry
                // for now, dumb sync will retry from ask/tocks
            }

            default: toss(`unrecognized mail line: ${line}`)

        } /* switch */ } catch(e) {
            return fail(e.message)
        }
        toss(`panic/unreachable`)
    }

    async *spin(mails:Mail[]) :AsyncGenerator<Okay<Mail[]>, null, void> {
        for (let mail of mails) {
            yield this.turn(mail)
        }
        return null
    }
}
