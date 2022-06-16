// lib, dsl, and cli

export {
    TickMold, tick
}

import {
    okay, toss,
    Byte, Bnum,
    Blob, Roll,
    roll, mash,
    Tick, Tock,
    Code, Cash,
    Sign, Seck,
    b2h, h2b
} from './word.js'

import {
    form_tick
} from './well.js'

import {
    vinx_tick
} from './vinx.js'

function tick() :TickMold {
    return new TickMold()
}

class TickMold {
    _raw :Roll[][]
    constructor() {
        this._raw = [[], []]
    }
    i(txin, indx, sign?) {
        // todo cast from all kinds of things
        // todo assert max 7
        this._raw[0].push([txin, indx, sign ? sign : h2b('')])
        return this
    }
    o(code, cash) {
        // todo casts
        // todo assert max 7
        this._raw[1].push([code, cash])
    }
    sign(keys :Seck[], indx?) {
        // if index given, only sign that one
        // otherwise sign all
        // try each key
        return this
    }
    mold() :Tick {
        // form_tick
        // vinx_tick
        toss(`todo tickmold`)
        return this._raw as Tick
    }
}

class TockMold {
    _raw : Blob[]
    constructor() {
        this._raw = [
            h2b('00'.repeat(24)),
            h2b('00'.repeat(24)),
            h2b('00'.repeat(7)),
            h2b('00'.repeat(7)),
        ]
    }
    mold() {
        // todo need form_tock
        return this._raw as Tock
    }
    prev(blob) {
        // todo assert
        this._raw[0] = blob
        return this
    }
    root(b) { return this }
    time(b) { return this }
    fuzz(b) { return this }
    // how many ms to work
    async mine(time:number) {
        let best = ''
        let done = false
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                done = true
                resolve(best)
            }, Math.floor(Date.now() + time));
            for (let i = 0;; i++) {
                if (done) {
                    return best
                } else {
                    this.fuzz(h2b(i.toString(16)))
                    let hash = mash(roll(this._raw))
                    // if hash < best
                    // best = hash
                }
            }
        })
    }
}
