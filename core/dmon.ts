import {h2b, Memo, memo, MemoType, okay, toss,} from './word.js'

import {Djin} from './djin.js'
import {Plug} from './plug.js'

class Dmon {
    djin :Djin
    plug :Plug

    // data dir, wss port
    async init(path :string, port :number) {
        this.djin = new Djin(path)
        this.plug = new Plug(port)
    }

    async play() {
        this.serv()
        this.sync()
    }

    // handle requests
    serv() {
        this.plug.when((memo :Memo, back:((_:Memo)=>void)) => {
            // mail = form_roll(mail)
            // assert line is ask

            // djin will give:
            //   ask/* -> say/* back
            //   *     -> err/why reason

            // depending on error type,
            // disconnect / backoff / just respond
            let out = this.djin.turn(memo)
            back(out)
            toss(`todo dmon.serv`)
        })
    }

    // resolves when self-sync is done and peer-sync has started
    async sync(tail = h2b('')) {
        // try to sync with yourself first
        let yarn = this.djin.turn(memo(MemoType.AskTocks, tail))
        // todo need yarn is not err type
        let head
        for await (head of this.djin.spin(yarn)) {}
        // get the best possibly-valid tocks from peers, then make a
        // request for the thing you need on each branch
        this.plug.emit(memo(MemoType.AskTocks, head), async yarn => {
            let miss
            for await (miss of this.djin.spin(yarn)) {}
            if (miss) {
                this.plug.emit(miss, fill => this.sync(tail))
            }
        })
    }

}

