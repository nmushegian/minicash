import elliptic from 'elliptic'
import {addr, roll, sign, t2b} from "./core/word";
const _ec = new elliptic.ec('secp256k1')
import { jams } from 'jams.js'

const privkeys = [
  Buffer.from('0xeec8324cc41d9ee94caa3ac8740519572465cfdbb5c3f22db692713b0acfd954')
]
const data = process.argv[0]

privkeys.forEach((privkey) => {
  const keypair = _ec.keyFromPrivate(privkey)
  const pubkey = Buffer.from(keypair.getPublic().encodeCompressed())

  const code = addr(pubkey)
  const data = jams(process.argv[0])
  const move = data.args[0]
  const ments = data.args[1]
  const mask = roll([
      t2b("minicash movement"),
      [move],
      ments
  ])
  const sig = sign(mask, privkey)
  console.log(`signed with privkey ${privkey.toString()}`)
  console.log(`addr: ${addr}`)
  console.log(`sign: ${sig}`)
})

//

