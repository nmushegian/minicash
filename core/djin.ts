// engine

import {
    Okay, pass, fail, toss,
    blob, roll,
    Mish, Mesh, mesh,
    Mail
} from './type.js'

import { Rock } from './rock.js'
import { Tree } from './tree.js'

export { Djin }

class Djin {
    best :Mesh   // best definitely-valid tock (cumulative work)
    race :Mesh[] // top K possibly-valid tocks (cumulative work)
    rock :Rock   // content-addressed values
    tree :Tree   // per-tock view of state

    constructor(rock :Rock) {
        this.rock = rock
        this.tree = new Tree(this.rock)

        let tickzero = [[],[]]     // degenerate transaction
        let tockzero = [
            blob('00'.repeat(24)), // seed0
            mesh(roll(tickzero)),  // merkle root
            blob('00'.repeat(7)),  // timestamp
            blob('00'.repeat(7))   // seed1
        ]
        //this.rock.tick_add(tickzero)
        //this.rock.tock_add(tockzero)
        //vult_full(this.rock, this.tree, this.tockzero, [this.tickzero])
    }

    turn(mail :Mail) :Okay<Mail> {
        let [line, body] = mail

        try { switch (line.toString()) {
            case 'ann/ticks': {
                // relay if valid-in-context with > relay fee
                toss(`todo`)
            }

            case 'ask/tocks': {
                let init = body
                // grab tocks from rock.tocks
                let tocks = []
                return pass([blob('ans/tocks'), tocks])
            }
            case 'ask/tacks': {
                let [tockid, tickidx] = body
                // grab tick IDs from rock.tacks
                let feet = []
                let neck = []
                toss(`todo`)// ['ans/tacks', neck, feet]
            }
            case 'ask/ticks': {
                let tickids = body
                // grab ticks from rock.ticks
                let ticks = []
                toss(`todo`)//['ans/ticks', ticks]
            }

            case 'res/tocks': {
                // ...
                // tock_form
                // tock_vinx
                // add rock.tock
                // try vult_thin
                // try vult_full
                // emit ask/tacks
                // emit ask/ticks
            }
            case 'res/tacks': {
                // ...
                // tack_form
                // tack_vinx
                // add rock.tack
                // try vult_full
                // emit ask/ticks
            }
            case 'res/ticks': {
                // ...
                // tick_form
                // tick_vinx
                // add rock.tick
                // later, do something smarter to know what to retry
                // for now, dumb sync will retry from ask/tocks
            }

            default: toss(`unrecognized mail line: ${line}`)

        } /* switch */ } catch(e) {
            return fail(e.message)
        }
        toss(`panic/unreachable`)
    }

    // attempt to vult
    // get some mail out for what you need to proceed
    step(head :Mesh) :Okay<Mail[]> {
        // vult_thin
        // vult_full
        return fail(`todo`)
    }
}
