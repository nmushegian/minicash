import {Server} from 'socket.io'
import {io} from 'socket.io-client'

import {b2h, Memo, memo_open, MemoType, rmap} from './word.js'

import Debug from 'debug'

const debug = Debug('plug::test')

export { Plug }

class Plug {
    addr
    server
    peers
    constructor(port :number, peers :string[]) {
        this.server = new Server(port);
        this.addr = `127.0.0.1:${port}`
        debug(`listening on ${this.addr}`)
        this.peers = []
        peers.forEach(peer => this.peers.push(peer))
    }
    when( what:( (memo:Memo,back:((memo:Memo)=>void) )=>void) ) {
        this.server.on('connection', (sock) => {
            sock.once('minicash', mail => {
                let [peer, memo] = mail as [string, Memo] // peer enforced in other transport types
                debug('mail', peer, rmap(memo, b2h))
                what(memo, out => {
                    this.emit(out, peer)
                })
            })
        })
    }
    emit(memo:Memo, dest? :string) {
        // can also take K random, rotate, etc
        let peers = this.peers
        if (undefined != dest) {
            peers = [dest]
        }
        peers.forEach((peer) => {
            let sock = io('http://' + peer)
            //sock.send(roll([t2b(this.addr), memo]))
            sock.timeout(2000).emit('minicash', [this.addr, memo])
            sock.close()
        })
    }
    kill() {
        this.server.close()
    }
}
