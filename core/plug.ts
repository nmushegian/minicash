import { WebSocketServer } from 'ws'
import {
    Blob,
    Mail, Memo, memo,
    Peer,
    h2b
} from './word.js'

export { Plug }

class Plug {
    pubk
    socks
    peers
    constructor(port :number) {
        this.socks = new WebSocketServer({ port });
        this.peers = {}
        this.pubk = h2b('ee')
    }
    when( what:( (memo:Memo,back:((memo:Memo)=>void) )=>void) ) {
        this.socks.on('connection', sock => {
            sock.on(mail => {
                let [_, memo] = mail // peer enforced in other transport types
                what(memo, outs => {
                    for (let out of outs) {
                        let [oline, obody] = out as Memo;
                        // respond, or disconnect
                        sock.send([this.pubk, out])
                    }
                })
            })
        })
    }
    async emit(memo:Memo, back:((memo:Memo)=>void)) {
        // can also take K random, rotate, etc
        this.peers.forEach((p,_) => {
            p.send([this.pubk, memo], back)
        })

    }

}
