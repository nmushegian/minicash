// simple block producer

// One principle of minicash is that client developers should
// cooperate on full nodes, and compete on pool nodes.
// You want to make sure that all clients can efficiently process valid blocks you produce,
// but you have no incentive to help other pools actually produce them.
// You should not expect this pool code to produce full-sized blocks competitively.

export { Pool }

import {
    Djin
} from './djin.js'

import {
    err,
    Tick, Tock, Tack,
    Mark, Fuzz,
    Mash, Snap,
    mash, roll,
    MemoType, memo_close,
    Hexs,
    h2b
} from './word.js'


class Pool {
    djin :Djin

    bowl :Tick[] // vinx'd
    sunk :Tick[] // tock candidate's ticks
    bush :{string:Tick} // candidate utxo set,  Mark -> contained in Tick
    peak :{number:Tock} // best candidate tocks for given index in sink
    part :{number:Tack} // tacks for given cycle

    constructor(djin) {
        this.djin = djin
    }

    sink(ticks :Tick[]) {
        let out = this.djin.turn(memo_close([MemoType.SayTicks, ticks]))
        // filter ticks w/ unavailable conx
        // now all ticks are vinx'd and in rock
        this.bowl.push(...ticks)
    }

    cycl() {
        // reset bush
        // while have time:
        //   deque from bowl
        //   check for mark conflict in bush
        //   update ment/pent in bush
        //   if filled up a tack, prep it
        //   update candidate
        // vult best tock, return it for broadcast
    }

    jobs() :Tock {
        // grab latest candidate tock
        throw err(`todo pool.jobs`)
    }

    // update best work for a candidate
    yell(job :Tock, better :Tock) {
    }

}
