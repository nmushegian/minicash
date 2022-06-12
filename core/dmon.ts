
import {
    Mail,
    Mesh,
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

    async *step() {
        // let in = tasks[task++ % tasks.length].dequeue()
        // let outs       = djin.step(in)   // makes progress, or sends request
        // let [ok, next] = djin.step(outs) // same msg if requested, next if available
        // if (!ok) plug.emit(next)
        // tasks.enqueue(next)
    }

    // inbound mail to start cycle
    task(init) {
        // tasks[task++] = init
    }

    async *sync() {
        // basic sync algorithm
        // makes progress incrementally by retrying repeatedly
        //
        // blocks for one djin.step(head) at a time
        //
        // for each peer
        //   plug.send([ask/tocks], lead =>
        //     for each lead
        //       start sync task
        //   kill all prior sync tasks
        //
        //
        // (sync task)
        //  for each head
        //  let outs = djin.step(head)
        //  plug.send(outs)
        //
        // (djin.step effective cycle via sync task)
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

