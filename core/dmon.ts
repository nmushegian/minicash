
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
    // data dir, wss port
    async init(path :string, port :number) {
        let  rock = new Rock(path)
        this.djin = new Djin(rock)
        this.plug = new Plug(port)
    }
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

            // ask/tocks -> res/tocks back
            // ask/tacks -> res/tacks back
            // ask/ticks -> res/ticks back
            // ann/ticks -> ann/ticks emit

            let outs = okay(this.djin.turn(mail))
            back(outs)
        })
    }

    // core basic sync algorithm
    // incrementally makes progress, yield as much as possible
    async *sync() {
        // clear self-messages first
        // don't spam requests while we can make progress
        // for await (let ins of this.ins.deq()) {
        //    let [ok, val, err] = await this.djin.spin(outs)
        //    if (ok) {
        //        await this.ins.enq(...val)
        //    } else {
        //    }
        // }

        // incrementally make progress
        // this code is written in a linear style but engine makes
        // progress in whatever order callbacks arrive in

        let init = ''

        // get the best possibly-valid tocks from peers
        // to update our set of leads
        //this.plug.emit(memo('ask/tocks', init), mail => {
            // ensure response is what we expect
            //this.ins.enq(mail)
        //})

        // get the tacks for the next possibly-valid tock
        //this.plug.emit(memo('ask/tacks', tockhashes), mail => {
        //})

        // get the ticks for the next possibly-valid tack
        // this.plug.emit(memo('ask/ticks', tickhashes), mail => {
        //})
    }

}

