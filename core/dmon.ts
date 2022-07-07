import {h2b, Memo, memo, memo_close, MemoType, okay,} from './word.js'

import {Djin} from './djin.js'
import {Plug} from './plug.js'
import {Pool} from "./pool.js";
import {Hexs} from "coreword";

export {Dmon}

import Debug from 'debug'
const debug = Debug('dmon::test')

class Dmon {
    djin :Djin
    plug :Plug
    pool :Pool
    minetime :Number

    // data dir, wss port
    init(path :string, port :number, pubkey :Hexs, peers :string[]) {
        this.djin = new Djin(path, true, true)
        this.plug = new Plug(port, peers)
        this.pool = new Pool(this.djin, this.plug, pubkey)
        this.minetime = 1000
    }

    play() {
        this.mine()
        this.serv()
        //this.sync()
    }

    kill() {
        this.plug.kill()
    }

    mine() {
        setInterval(() => {
            let starttime = performance.now()
            this.pool.mine(this.minetime)
            let endtime = performance.now()
            let muller = endtime - starttime > 2000 ? 0.9 : 1.1
            this.minetime = Math.floor(this.minetime.valueOf() * muller)
            debug('minetime =', this.minetime)
        },  2000)
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
            try {
                let out = okay(this.djin.turn(memo))
                back(out)
            } catch (e) {
                back(memo_close([MemoType.Err, ['invalid', []]]))
                console.error(e.message)
            }
        })
    }

    /*
    // resolves when self-sync is done and peer-sync has started
    sync(tail = h2b('')) {
        // try to sync with yourself first
        let [ty, yarn] = this.djin.turn(memo(MemoType.AskTocks, tail))
        // need todo ty not err
        let head
        for await (head of this.djin.spin(yarn)) {}
        // get the best possibly-valid tocks from peers, then make a
        // request for the thing you need on each branch
        this.plug.emit(memo(MemoType.AskTocks, head), async ([line, yarn]) => {
            let miss
            for await (miss of this.djin.spin(yarn)) {}
            if (miss) {
                this.plug.emit(miss, fill => this.sync(tail))
            }
        })
    }

     */

}

