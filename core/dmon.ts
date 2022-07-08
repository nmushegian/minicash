import {
    b2h,
    bleq,
    bnum,
    h2b,
    mash,
    Memo,
    memo_close,
    memo_open,
    MemoType,
    n2b,
    need,
    okay,
    rmap,
    roll,
    t2b,
    Tock,
    unroll,
} from './word.js'

import {Djin} from './djin.js'
import {Plug} from './plug.js'
import {Pool} from "./pool.js";
import {Hexs} from "coreword";
import Debug from 'debug'
import {rkey} from "./tree.js";
import {readFileSync} from "fs";

import {jams} from 'jams.js'

export {Dmon}

const debug = Debug('dmon::test')

class Dmon {
    djin :Djin
    plug :Plug
    pool :Pool
    minetime :number
    epoch :number
    speedup :number
    period :number
    name :string
    shutdown :boolean

    // data dir, wss port
    init(
        name :string, path :string, port :number, pubkey :Hexs, peers :string[],
        epoch :number, period: number, speedup :number, reset :boolean
    ) {
        this.djin = new Djin(path, true, true)

        if (!reset) {
            let file = readFileSync(path+'/reconstruct.jams')
            let data = jams(file.toString())
            data.forEach(cmd => {
                let memo = rmap(cmd[1], h2b)
                try {this.djin.turn(memo)} catch (e) {console.log(e.message)}
            })
        }

        this.plug = new Plug(port, peers)
        this.pool = new Pool(this.djin, this.plug, pubkey)
        this.period = period
        this.epoch = epoch
        this.period = period
        this.speedup = speedup
        this.minetime = 1000
        this.name = name
        this.shutdown = false
    }

    play() {
        this.serv()
    }

    kill() {
        this.plug.kill() // no network triggers
        this.shutdown = true // turn off miner
        setImmediate(() => this.djin.kill())
    }

    async mine() :Promise<string> {

        const spin = async (endtime) => {
            while (true) {
                await (new Promise(resolve => setTimeout(resolve, 0)))
                let realtime = (Date.now() - this.epoch) * this.speedup
                if (realtime > endtime) {
                    return
                }
            }
        }

        let nexttockhash
        while (true) {
            if (this.shutdown) {
                debug(`got shutdown`)
                return nexttockhash
            }
            debug(`${this.name} mining...best=${b2h(this.djin.tree.rock.read_one(rkey('best')))}`)

            ;[nexttockhash,] = this.pool.mine(this.minetime)

            // adjust minetime if mining too slow or fast
            let besthash = this.djin.tree.rock.read_one(rkey('best'))
            let best = unroll(this.djin.tree.rock.read_one(rkey('tock', besthash))) as Tock
            let next = unroll(this.djin.tree.rock.read_one(rkey('tock', h2b(nexttockhash)))) as Tock
            debug(`${this.name} mined a tock @${nexttockhash} tock=${rmap(next, b2h)} best=${b2h(besthash)}`)
            this.plug.emit(memo_close([MemoType.SayTocks, [next]]))

            let [,,time,] = best
            let tocktime = Number(bnum(time)) * 1000
            let realtime = (Date.now() - this.epoch) * this.speedup
            let muller = (tocktime + this.period) > realtime? 1.1 : 0.9
            this.minetime = Math.floor(this.minetime * muller)
            if (this.minetime < 10) {
                this.minetime = 10
            }
            await spin(tocktime + this.period)
        }
    }

    // handle requests
    serv() {
        let poller = mash(roll(this.djin.bang))
        this.plug.when((memo :Memo, back:((_:Memo)=>void)) => {
            // mail = form_roll(mail)
            // assert line is ask

            // djin will give:
            //   ask/* -> say/* back
            //   *     -> err/why reason

            // depending on error type,
            // disconnect / backoff / just respond
            try {
                need(MemoType.Err != memo_open(memo)[0], `${this.name} received error memo`)
                let prevbest = this.djin.tree.rock.read_one(rkey('best'))
                if (MemoType.SayTocks == memo_open(memo)[0]) {
                    debug(`${this.name} got say/tocks ${memo[1].length} ${b2h(mash(roll(memo[1][0] as Tock)))}...${rmap(memo, b2h)}`)
                    let tocks = memo[1]
                    tocks.reverse().forEach(tock => {
                        let out = okay(this.djin.turn(memo_close([MemoType.SayTocks, [tock]])))
                        need(MemoType.Err != memo_open(out)[0], `dmon: turn returned an error`)
                        back(out)
                    })
                } else {
                    let out = okay(this.djin.turn(memo))
                    need(MemoType.Err != memo_open(out)[0], `dmon: turn returned an error`)
                    back(out)
                }

                let nextbest = this.djin.tree.rock.read_one(rkey('best'))
                if (!bleq(prevbest, nextbest)) {
                    poller = nextbest
                    debug(`${this.name} UPDATED BEST FROM PEER besthash=${b2h(nextbest)}`)
                }
            } catch (e) {
                debug(`${this.name} got an error turning a memo from network, polling from ${b2h(poller)}`)
                //debug(e.message)
                back(memo_close([MemoType.AskTocks, poller]))
                return
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

