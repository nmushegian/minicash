
import {
    Mail,
    okay,
    blob,
} from './word.js'

import { Rock } from './rock.js'
import { Djin } from './djin.js'

import { Plug } from './plug.js'

class Dmon {
    djin :Djin // can access .rock, .tree
    plug :Plug
    _tasks
    _taskc
    constructor(datapath?:string, port?:number) {
        let rock = new Rock()
        if (datapath) {
            rock.load(datapath)
        }
        this.djin = new Djin(rock)
        this.plug = new Plug(port || 17777)
    }
    async init() {}
    async play() {
        this.serv()
        for await (let loop of this.sync()) {}
    }

    // handle requests
    serv() {
        this.plug.when((mail,back) => {
            // mail = form_roll(mail)
            // respond to requests immediately
            // this will be read-only turn, except ann/* does rock.etch
            let outs = okay(this.djin.turn(mail))
            back(outs)
        })
    }

    // core basic sync algorithm
    // incrementally makes progress, yield as much as possible
    async *sync() {
        // clear self-messages first
        // don't spam requests while we can make progress
        // for await (let outs of this.djin.spin(ins)) {
        //    let refl = this.djin.spin(outs)
        //    await this.ins.enq(refl)
        // }

        // incrementally make progress
        // get leads | turn | ask tocks
        // get tocks | turn | ask tacks
        // get tacks | turn | ask ticks
        // get ticks // retry tocks next loop
    }

}

