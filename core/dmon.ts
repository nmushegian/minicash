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

    // data dir, wss port
    async init(path :string, port :number) {
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

            // assert line is ask

            // djin will give:
            //   ask/tocks -> say/tocks back
            //   ask/tacks -> say/tacks back
            //   ask/ticks -> say/ticks back
            //   * -> end/why reason    back  // disconnect

            let out = okay(this.djin.read(memo))
            back(out)

        })
    }

    sync(freq=5000) {
        return setInterval(()=>{
            // get the best possibly-valid tocks from peers
            // to update our set of leads
            let init = h2b('') // pick a 'finalized' block in our best chain
            // one response from each peer
            this.plug.emit(memo('ask/tocks', init), lead => {
                // one step can emit more than one request memo.
                // send requests and apply those responses, but only one layer.
                // retry via sync loop rather than trying to follow
                // branches in an intelligent way
                let head = lead[0] // follow lead until your last possibly-valid
                let outs = okay(this.djin.turn(head))
                outs.forEach(out => this.plug.emit(out, next => {
                     this.djin.turn(next)
                }))
            })
        }, freq)
    }

}

