
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
        this.plug.when((mail,back) => {
            // mail = form_roll(mail)
            // respond to requests immediately
            // this will be read-only turn
            let outs = okay(this.djin.turn(mail))
            back(outs)
            // TODO factor these into spin
            // don't respond to responses, just send ack/end
            // enqueue them for djin to turn async
            // this.iq.send(mail)
            // back([ack])
        })
        this.plug.play()
        ;(async ()=> {
            for await (let loop of this.sync()) {}
        })()
        for await (let $_$ of this.djin.spin({}, {})) {}
    }

    async *tisk() {
        //   primitive time-share based on cumulative pow of leads
        //   yield after every call, return after some number of event loops
        // let task = this._tasks[ ... ]
        // await task()
        // yield
        // after k, return
    }

    _task(f) {
        // this._tasks[...] = f
    }

    async *sync() {
        let _tasks = this._tasks
        this._tasks = {}
        let mail = [blob(''), [blob(''), blob('')]] as Mail
        this.plug.emit(mail, back => {
            let [line, lead] = back
            this._task(async ()=>{
                // deq next mail from oq
                // if we have the data, enq it and yield
                // if not, request it and yield (enq in callback)
            })
        })
        // kill all prior tasks
        // _tasks.each(kill)
        // do one cycle of tasks
        for await (let loop of this.tisk()) {}
    }

}

