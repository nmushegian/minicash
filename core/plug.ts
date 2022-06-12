
import { WebSocketServer } from 'ws'
import { Mail } from './word.js'

export { Plug }

class Plug {
    wss
    constructor(port :number) {
        this.wss = new WebSocketServer({ port });
    }
    when(what:((mail:Mail,back:((mail:Mail)=>void)) => void)) {
        this.wss.on('connection', ws => {
            // add to connections
            ws.on(msg => {
                what(msg, outs => {
                    outs.map(out => ws.send(out))
                })
            })
        })
    }
    async emit(mail:Mail) {
        // for each connection, send it
    }
    async play() {}
}
