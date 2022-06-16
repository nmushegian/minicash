// lib, dsl, and cli

export {
    TickMold, tick
}

import {
    okay, toss,
    Byte, Roll,
    Tick, Code, Cash,
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
