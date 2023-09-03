import {
    h2b,
    okay, toss,
    Memo, memo, MemoType,
} from './word.js'

import {
    form_memo
} from './well.js'

import { Djin } from './djin.js'
import { Plug } from './plug.js'
import { Pool } from './pool.js'

class Dmon {
    djin :Djin
    plug :Plug
    pool :Pool
    stat :boolean

    // data dir, wss port, mood
    async init(path :string, port :number, pool :boolean) {
        this.djin = new Djin(path)
        this.plug = new Plug(port)
        if (pool) {
            this.pool = new Pool(this.djin)
        }
    }

    async play() {
        this.serv()
        this.sync()
    }

    // stat mood: handle requests only
    serv() {
        this.plug.when((memo :Memo, back:((_:Memo)=>void)) => {
            try {
                memo = okay(form_memo(memo))
                // if full mood, only accept ask/* for queries
                let out = this.djin.turn(memo)
                back(out)
                toss(`todo dmon.serv`)
            } catch (e) {
                // todo give 'disconnect' or 'backoff'
                toss(e.message)
            }
        })
    }

    // resolves when self-sync is done and peer-sync has started
    // full mood: sync eagerly
    // pool mood: alternate sync/cycl
    async sync(tail = h2b('')) {
        // try to sync with yourself first
        let yarn = this.djin.turn(memo(MemoType.AskTock, tail))
        // todo need yarn is not err type
        let head
        for await (head of this.djin.spin(yarn)) {}
        // get the best possibly-valid tocks from peers, then make a
        // request for the thing you need on each branch
        this.plug.emit(memo(MemoType.AskTock, head), async yarn => {
            let miss
            for await (miss of this.djin.spin(yarn)) {}
            if (miss) {
                this.plug.emit(miss, fill => this.sync(tail))
            }
        })
    }

}

