import {
    Roll, h2b,
    Memo, memo,
    Tock,
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
        this.plug.when((mail,back) => {
            // mail = form_roll(mail)
            // respond to requests immediately
            // this will be read-only turn, except ann/* does rock.etch

            // assert mail is ask/* or ann/*

            // djin will give:
            //   ask/tocks -> res/tocks back
            //   ask/tacks -> res/tacks back
            //   ask/ticks -> res/ticks back
            //   ann/ticks -> ann/ticks emit

            let outs = okay(this.djin.turn(mail))
            back(outs)
        })
    }

    sync(freq=5000) {
        return setInterval(()=>{
            // get the best possibly-valid tocks from peers
            // to update our set of leads
            let init = h2b('') // todo tock zero
            this.plug.emit(memo('ask/tocks', init), mail => {
                // assert response is what we expect

                // form_tock, vinx_tock, rock.etch
                // vult_thin (updates possibly-valid)

                // for top K branches,
                //    //  maybe updates definitely-valid; requests what it needs next
                //    wants = vult_full
                //    plug.emit(wants, memo => {
                //      if (tack) {
                //        form_tack; vinx_tack; etch/grow
                //      }
                //      if (ticks) {
                //        form_tick; vinx_tick;
                //      }
                //      // retry vult next cycle
                //    })
            })
        }, freq)
    }

}

