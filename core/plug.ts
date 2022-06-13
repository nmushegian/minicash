
import { WebSocketServer } from 'ws'
import { Mail } from './word.js'

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
                what(mail, outs => {
                    for (let out of outs) {
                        this.drop(peer)
                    }
                    outs.map(out => sock.send(out))
                })
            })
        })
    }
    async emit(mail:Mail, back:((mail:Mail)=>void)) {
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
