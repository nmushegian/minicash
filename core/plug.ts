
import { WebSocketServer } from 'ws'
import {
    Mail, Memo
} from './word.js'

export { Plug }

type Peer = string

class Plug {
    socks
    peers
    constructor(port :number) {
        this.socks = new WebSocketServer({ port });
        this.peers = {}
    }
    when( what:( (mail:Mail,back:((mail:Mail)=>void) )=>void) )
    {
        this.socks.on('connection', sock => {
            let peer = 'sock.url'
            this.link(peer, sock)
            sock.on(mail => {
                let [_, memo] = mail // peer enforced in other transport types
                what(memo, outs => {
                    for (let out of outs) {
                        sock.send(out)
                        let [oline, obody] = out as Memo;
                        if (oline.slice(0,3).equals(Buffer.from('end'))) {
                            this.drop(peer)
                        }
                    }
                })
            })
        })
    }
    async emit(memo:Memo, back:((memo:Memo)=>void)) {
        // for each connection, send it
        // can also take K random, rotate, etc
    }

    // todo link/drop cleanup etc
    link(peer :Peer, sock:any) {
        this.peers[peer] = sock
    }
    drop(peer :Peer) {
        let sock = this.peers[peer]
        delete this.peers[peer]
    }
    pals() :Peer[] {
        return Object.keys(this.peers)
    }
}
