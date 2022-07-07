import { WebSocketServer } from 'ws'
import {
    Blob,
    Mail, Memo, memo,
    Peer,
    h2b, t2b, roll
} from './word.js'

export { Plug }

class Plug {
    addr
    socks
    peers
    constructor(port :number, peers :string[]) {
        this.socks = new WebSocketServer({ port });
        this.addr = `127.0.0.1:${port}`
        this.peers = []
        peers.forEach(peer => this.peers.push(peer))
    }
    when( what:( (memo:Memo,back:((memo:Memo)=>void) )=>void) ) {
        this.socks.on('connection', sock => {
            sock.on(mail => {
                let [peer, memo] = mail // peer enforced in other transport types
                what(memo, outs => {
                    for (let out of outs) {
                        let [oline, obody] = out as Memo;
                        // respond, or disconnect
                        sock.send([this.addr, out])
                        this.emit([this.addr, out], peer)
                    }
                })
            })
        })
    }
    emit(memo:Memo, peer? :string) {
        // can also take K random, rotate, etc
        let peers = this.peers
        if (undefined != peer) {
            peers = [peer]
        }
        peers.forEach((peer) => {
            let sock = new WebSocket('http://'+peer)
            sock.send(roll([t2b(this.addr), memo]))
            sock.close()
        })
    }
    async kill() {
        this.socks.close()
    }
}
