import {
    Djin
} from './djin.js'

import {
    Plug
} from './plug.js'

import {
    Tick, Tock,
    Mash, Snap,
    mash, roll,
    memo,
    Hexs,
    h2b
} from './word.js'


class Pool {
    djin :Djin
    plug :Plug

    bowl :Tick[]           // mempool

    // each of these should be in per-candidate map, aka use a pure Tree
    sink :Tick[]           // tock template
    sunk :{string:boolean} // ticks in this sink back index
    root :Mash   // active merk root
    snap :Snap   // active UTXO set handle

    best :Tock   // best pow for this cycle
    roots :Map<Hexs,[Snap,number]>   // root -> [snap, fill.idx]  reverse index

    constructor(djin, plug) {
        this.djin = djin
        this.plug = plug
    }

    pool() {
        this.plug.when((memo, back) => {
            // ask/jobs
            //   let job = [best.tock, fill.length]
            // say/work
            //   update best
            // say/ticks ticks
            //   this.snap = this.djin.tree.grow_twig(this.snap, twig => {
            //      deque tick from bowl
            //      let ok = vult_tick(twig, tick)
            //      if (ok)
            //         this.sink.push(tick)
            //   })
            //   root = remerk(this.sink)
            //   roots[root] = this.snap
            // say/tock tock
            //   this.djin.turn(tock)
        })
    }

}
