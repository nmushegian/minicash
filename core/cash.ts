// lib, dsl, and cli

import {
    okay, toss, need,
    Byte, Bnum,
    Blob, Roll,
    bnum,
    roll, mash, extend,
    Tick, Tock,
    Code, Cash,
    Sign, Seck,
    b2h, h2b, n2b,
} from './word.js'

import {
    form_tick
} from './well.js'

export {
    mold_tick,
    mold_tock
}

function mold_tick() :TickMold {
    return new TickMold()
}

function mold_tock() :TockMold {
    return new TockMold()
}

class TickMold {
    _raw :Roll[][]
    constructor() {
        this._raw = [[], []]
    }
    move_tock(tock :Tock, xtra? :Blob) {
        need(this._raw[0].length == 0, `tickmold.move_tock can only have 1 move`)
        need(!xtra || xtra.length == 65, `move_tock provided xtra (sig) is wrong length`)
        this._raw[0].push( [
            mash(roll(tock)),
            h2b('07'),
            xtra ? xtra : h2b('00'.repeat(65))
        ] )
        return this
    }
    ment(code :Code, cash :Cash|bigint|number) {
        if (typeof(cash) == 'number') {
            console.log('its a number')
            cash = extend(n2b(BigInt(cash)), 7)
        } else if (typeof(cash) == 'bigint') {
            cash = extend(n2b(cash), 7)
        }
        this._raw[1].push([code, cash])
        return this
    }
    sign(key :Seck, indx : number | string) {
        // if index given, only sign that one
        // otherwise sign all
        return this
    }
    mold() :Tick {
        return okay(form_tick(this._raw))
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

    // how many ms to work, will work at least 50ms if less
    async mine(time:number) {
        let best = mash(roll(this._raw))
        let done = false
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                done = true
                resolve(best)
            }, Math.floor(Date.now() + time));
            let fuzz = 0
            setInterval(() => {
                for (let i = 0; i < 1000; i++) {
                    if (done) {
                        return best
                    } else {
                        fuzz++
                        this.fuzz(h2b(fuzz.toString(16)))
                        let hash = mash(roll(this._raw))
                        if (bnum(hash) < bnum(best)) {
                            best = hash
                        }
                    }
                }
            }, 50)
        })
    }
}
