// engine

import {
    Okay, pass, fail,
    blob,
    Mish, Mesh,
    Mail
} from './type.js'

import { Rock } from './rock.js'
import { Tree } from './tree.js'

class Djin {
    best :Mesh   // best definitely-valid tock (cumulative work)
    race :Mesh[] // top K possibly-valid tocks (cumulative work)
    rock :Rock   // content-addressed values
    tree :Tree   // per-tock view of state

    turn(mail :Mail) :Okay<Mail> {
        let [line, body] = mail

        switch (line.toString()) {
            case 'ask/tocks': {
                let init = body
                // grab tocks from glob.tocks
                let tocks = []
                return pass([blob('ans/tocks'), tocks])
            }
            case 'ask/tacks': {
                let [tockid, tickidx] = body
                // grab tick IDs from glob.tacks
                let feet = []
                let neck = []
                return fail(`todo`)// ['ans/tacks', neck, feet]
            }
            case 'ask/ticks': {
                let tickids = body
                // grab ticks from glob.ticks
                let ticks = []
                return fail(`todo`)//['ans/ticks', ticks]
            }

            case 'ans/tocks': {
                // ...
                // tock_form
                // tock_vinx
                // add glob.tock
                // try vult_thin
                // try vult_full
                // emit ask/tacks
            }
            case 'ans/tacks': {
                // ...
                // tack_form
                // tack_vinx
                // add glob.tack
                // try vult_full
                // emit ask/ticks
            }
            case 'ans/ticks': {
                // ...
                // tick_form
                // tick_vinx
                // add glob.tick
                // later, do something smarter to know what to retry
                // for now, dumb sync will retry from ask/tocks
            }

            default: {
                return fail(`unrecognized mail line: ${line}`)
            }
        }
        return fail(`panic/unreachable`)
    }

    // attempt to vult
    // get some mail out for what you need to proceed
    step(head :Mesh) :Okay<Mail[]> {
        // vult_thin
        // vult_full
        return fail(`todo`)
    }
}
