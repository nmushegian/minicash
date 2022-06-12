
import {
    Mail,
    okay,
} from './word.js'

import { Rock } from './rock.js'
import { Djin } from './djin.js'

import { Plug } from './plug.js'

class Dmon {
    djin :Djin // can access .rock, .tree
    plug :Plug
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
        this.plug.when((mail,back) => {
            // mail = form_roll(mail)
            let outs = okay(this.djin.turn(mail))
            back(outs)
        })
        this.plug.play()
        for await (let spin of this.sync()) {}
    }

    async *sync() {
        // basic sync algorithm
        // makes progress incrementally by retrying repeatedly
        //
        // blocks for one djin.step(head) at a time, you should
        // split compute time equally among top K candidates
        //
        // plug.send([ask/tocks])
        // for each lead
        //   for each head
        //     let outs = djin.step(head)
        //     plug.send(outs)
        //
        // (djin logic)
        //  for given head
        //    ask for tock
        //      ask for tacks
        //      | for each tack
        //      |   ask for ticks
        //      if all tacks present
        //        if all ticks present
        //          apply all ticks
        //          if tock is best, update best
    }

}

