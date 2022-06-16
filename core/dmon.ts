import {
    Roll, h2b,
    Memo, memo,
    Tock,
    Mode,
    okay,
} from './word.js'

import { Djin } from './djin.js'
import { Plug } from './plug.js'
import { Chan } from './chan.js'

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
            // get the best possibly-valid tocks from peers, then make a
            // request for the thing you need on each branch
            let init = this.djin.tail()
            this.plug.emit(memo('ask/tocks', init), async ([line, yarn]) => {
                let miss
                for await (miss of this.djin.spin(yarn))
                { continue }
                if (miss) {
                    this.plug.emit(miss, fill => this.djin.spin(fill))
                }
            })
        }, freq)
    }

}

