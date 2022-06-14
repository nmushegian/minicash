
import {
    Mail, Tock,
    okay,
    blob,
} from './word.js'

import { Rock } from './rock.js'
import { Djin } from './djin.js'

import { Plug } from './plug.js'

// one sync task deals with one finite possibly-valid branch
// run by dmon.sync cycle
class Task {
    djin :Djin
    plug :Plug
    lead :Tock[]
    constructor(djin :Djin, plug :Plug, lead :Tock[]) {
        this.djin = djin
        this.plug = plug
        this.lead = lead
    }
    // one step initiates one callback chain, will require
    // as many steps as needed to download everything
    // duplicate mails can be made close to no-ops on both ends of plug
    async step() {
        let init = this.lead[0]
        // djin.turn / vult_thin
        this.plug.emit([blob(''), [Buffer.from('ask/tacks'), init]], mail => {
            // djin.turn / vult_part
            let tickhashes = []
            this.plug.emit([blob(''), [Buffer.from('ask/ticks'), tickhashes]], mail => {
                // djin.turn / vult_full
                // if valid, proceed
                // if invalid, kill(true)
                // this.leads = this.leads.slice(1)
            })
        })
        // if timed out
        //   kill(false)  // dont invalidate, just give up
    }
    kill(bane :boolean) {
        // gracefully end all active callbacks
        // if (bane)
        //   mark definitely-invalid all subsequent tocks in chain
    }
}

class Dmon {
    djin :Djin
    plug :Plug
    jobs :Task[]

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

    async *sync() {
        // while true {

        // clear self-messages first
        // don't spam requests while we can make progress
        // for await (let ins of this.ins.deq()) {
        //    let [ok, val, err] = await this.djin.spin(outs)
        //    if (ok) {
        //        await this.ins.enq(...val)
        //    } else {
        //    }
        // }

        // get the best possibly-valid tocks from peers
        // to update our set of leads
        // start new sync tasks and kill old sync tasks
        let init = []
        this.plug.emit([blob(''), [blob(''), init]], mail => {
            // assert response is what we expect
            //this.ins.enq(mail)
        })

        // cycle through sync tasks for a little while
        //   for task in _tasks[taskc++ % taskc]
        //     yield await task.step()

        // yield
        // } // while true
    }

}

