import {b2h, bnum, h2b, Memo, memo, memo_close, MemoType, okay, Tock, unroll,} from './word.js'

import {Djin} from './djin.js'
import {Plug} from './plug.js'
import {Pool} from "./pool.js";
import {Hexs} from "coreword";

export {Dmon}

import Debug from 'debug'
import {rkey} from "./tree.js";
const debug = Debug('dmon::test')

class Dmon {
    djin :Djin
    plug :Plug
    pool :Pool
    minetime :number
    epoch :number
    speedup :number
    period :number

    // data dir, wss port
    init(path :string, port :number, pubkey :Hexs, peers :string[], epoch :number, period: number, speedup :number) {
        this.djin = new Djin(path, true, true)
        this.plug = new Plug(port, peers)
        this.pool = new Pool(this.djin, this.plug, pubkey)
        this.period = period
        this.epoch = epoch
        this.period = period
        this.speedup = speedup
        this.minetime = 1000
    }

    async play() {
        await this.mine()
        //this.serv()
        //this.sync()
    }

    kill() {
        this.plug.kill()
    }

    async mine() {

        const spin = async (endtime) => {
            while (true) {
                await (new Promise(resolve => setTimeout(resolve, 0)))
                let realtime = (Date.now() - this.epoch) * this.speedup
                if (realtime > endtime) {
                    return
                }
            }
        }

        while (true) {
            let nexttockhash = this.pool.mine(this.minetime)

            // adjust minetime if mining too slow or fast
            let besthash = this.djin.tree.rock.read_one(rkey('best'))
            let best = unroll(this.djin.tree.rock.read_one(rkey('tock', besthash))) as Tock
            let [,,time,] = best
            let tocktime = Number(bnum(time)) * 1000
            let realtime = (Date.now() - this.epoch) * this.speedup
            let muller = (tocktime + this.period) > realtime? 1.1 : 0.9
            this.minetime = Math.floor(this.minetime * muller)
            await spin(tocktime + this.period)

            debug(`mined a tock @${nexttockhash} minetime =`, this.minetime)
        }
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

