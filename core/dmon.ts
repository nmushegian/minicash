// daemon

import { Roll } from './coreword'

type Peer = string
type Mail = [string, Roll]

class Dmon {
    djin:any
    play() {
        // wire up `when` listeners
        this.when( (peer:Peer, mail:Mail) => {
            let outs = this.djin.turn(mail)
            // for out in outs
            // this.send(peer, outs)  or all, etc
        })
        // start `sync` loop
        setInterval(this.sync, 2000)
    }
    when(what:any) {}
    send(mail:any) {}
    sync() {}
}