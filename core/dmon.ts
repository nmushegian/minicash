import {
    Roll, h2b,
    Memo, memo,
    Tock,
    Mode,
    okay,
} from './word.js'

import { Rock } from './rock.js'
import { Djin } from './djin.js'
import { Plug } from './plug.js'

class Dmon {
    djin :Djin
    plug :Plug
    mode :Mode

    // data dir, wss port
    async init(path :string, port :number, mode :Mode = 'full') {
        let  rock = new Rock(path)
        this.djin = new Djin(rock)
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
            // respond to requests immediately
            // this will be read-only turn, except ann/* does rock.etch

            // assert line is ask/* or ann/*

            // djin will give:
            //   ask/tocks -> res/tocks back
            //   ask/tacks -> res/tacks back
            //   ask/ticks -> res/ticks back
            //   ann/ticks -> ann/ticks emit

            let outs = okay(this.djin.turn(memo))
            back(outs)
        })
    }

    sync(freq=5000) {
        return setInterval(()=>{
            // get the best possibly-valid tocks from peers
            // to update our set of leads
            let init = h2b('') // todo tock zero
            // one response from each peer
            this.plug.emit(memo('ask/tocks', init), memo => {
                // one step can emit more than one request memo.
                // send requesta and apply those responses, but only one layer.
                // retry via sync loop rather than trying to follow
                // branches in an intelligent way
                let outs = okay(this.djin.turn(memo))
                outs.forEach(out => this.plug.emit(out, next => {
                     this.djin.turn(next)
                }))
            })
        }, freq)
    }

}

