import {
    Okay, okay, toss, pass, fail, need, aver,
    Blob, bleq, blen, isblob, h2b, b2h, chop,
    Roll, islist, isroll, roll, unroll, rmap,
    Hexs,
    Hash, hash,
    Sign, Seck, sign,
    Pubk, scry
} from 'coreword'

export type {
    Okay,
    Bnum, Blob, Roll, Byte,
    Sign, Pubk, Seck,
    Mash, Code, Cash,
    Tick, Tock, Tack,
    Move, Ment,
    Know,
    Snap, Fees, Work,
    Peer, Mail, Memo,
    Mode,
    Hexs
}

export {
    okay, toss, pass, fail, need, aver,
    roll, unroll, rmap,
    bleq, blen, isblob, islist, isroll,
    b2h, h2b, t2b, b2t,
    mash, addr, merk,
    sign, scry,
    memo
}

function t2b(x :string) :Blob {
    return Buffer.from(x)
}

function b2t(x :Blob) :string {
    return Buffer.toString()
}

function addr(x :Blob) :Code {
    return chop(hash(x), 20)
}
function mash(x :Blob) :Mash {
    return chop(hash(x), 24)
}

function memo(line :string, body :Roll) :Memo {
    return [Buffer.from(line), body]
}

// marginal work
// given a hash, return how much to add to cumulative work
function work(x :Mash) :Bnum {
    throw new Error(`todo word.work`)
}

function _merk(x :Mash[]) :Mash {
    aver(_=> isroll(x), `_merk arg must be a roll`)
    aver(_=> x.length != 0, `_merk arg list must not be empty`)
    aver(_=> x.every(b => isblob(b)), `_merk arg list item must be a blob`)
    aver(_=> x.every(b => b.length == 24), `_merk arg list item must be len 24`)
    if (x.length == 1) {
        return x[0]
    }
    if (x.length % 2 == 1) {
        x.push(h2b('00'.repeat(24)))
    }
    for (let i = 0; i < x.length; i += 2) { // ! +2
        x[i] = mash(Buffer.concat([x[i], x[i+1]]))
    }
    x = x.slice(x.length/2)
    return _merk(x)
}

function merk(x :Mash[]) :Mash {
    aver(_=>{
        need(islist(x), `merk arg must be a list`)
        need(x.length > 0, `merk arg must have len > 0`)
        need(x.length <= 1024, `merk arg must have len <= 1024, use chunks`)
        x.every(y => isblob(y), `merk arg item is not a blob`)
        return true
    }, `merk preconditions`)
    return _merk(x.map(mash))
}

type Tick = [
    Move[], // max 7 inputs   [(Mark) Sign ]
    Ment[]  // max 7 outputs  [ Code  Cash ]
]
type Move = [
    Mash,  // utxo txin (input tick hash)
    Byte,  // utxo indx (0-6)
    Sign   // signature
]

// Concatenated utxo+txin, yields different croc32 checksum
// when they are checked like this instead of checked mash ++ idx.
// In the protocol spec they are separate items because it makes
// no difference to the encoding and it is easier to specify.
// These are the actual objects containing cash.
//type Mark = Blob25

type Ment = [
    Code,  // pkeyhash
    Cash   // minicash
]

type Mash = Blob24 // content hash
type Code = Blob20 // "address" (pubkeyhash)
type Cash = Blob7  // amount up to 2^53
type Byte = Blob1

type Tock = [
    Mash,  // prev  blob24 previous tockhash
    Mash,  // root  blob24 merkle root, max 2^17 leafs
    Time,  // time  blob7  padded timestamp
    Fuzz   // fuzz  blob7  miner nonce
]

type Time = Blob7
type Fuzz = Blob7
type Fees = Bnum

type Mode
 = 'thin'
 | 'full'
 | 'pool'
 | 'stat'

type Leaf = [
    Code, // address
    Cash, // amount
    Time, // expiry
    Mash, // spent by tick
    Mash  // spent in tock
]

type Fold = [
    Snap, // partial utxo
    Cash, // total in
    Cash, // total out
]

type Work = Bnum

export function tuff(x :Mash) :Work {
    let work = bnum(x)
    let u192 = bnum(h2b('ff'.repeat(24)))
    let tuff = u192 * u192 / work
    return tuff
}

type Snap = Blob // pure map snapshot internal representation

type Know
  = 'PV' // possibly-valid
  | 'DV' // definitely-valid
  | 'PN' // possibly-not-valid
  | 'DN' // definitely-not-valid

type Tack = [
    Tock   // head  tock these ticks belong to
  , Byte[] // eyes  which chunks are in this tack
  , Mash[] // ribs  chunk roots (merkle nodes at depth 7, empty if <1024 ticks in tock)
  , Mash[] // feet  tickhashes
]

type Peer = Blob  // opaque peer ID, could even be a roll

type Mail = [
    Peer, // peer  from
    Memo  // memo  [line, body]  (type, data)
]

type Memo = [
    Line, // line  type
    Roll  // body  data
]

type Line = Blob
type LineText   // body =
  = 'ask/tocks' // Mash       // init tock hash to sync from to best
  | 'ask/tacks' // Mash       // tockhash of tock you want tacks for
  | 'ask/ticks' // Mash[]     // tickhashes you want ticks for
  | 'say/tocks' // Tock[]     // chain of tocks, first to last
  | 'say/tacks' // Tack       // a single tack object represents multiple chunks
  | 'say/ticks' // Tick[]     // ticks you requested, topological order to give conx
  | 'err'       // [Why,Roll] // typed reason, untyped subreason

type Why
  = 'malformed'   // well
  | 'unavailable' // serv
  | 'invalid'     // vinx
  | 'unspendable' // vult

type Blob32 = Blob;
type Blob20 = Blob;
type Blob24 = Blob;
type Blob8  = Blob;
type Blob7  = Blob;
type Blob1  = Blob;
type Bnum   = bigint // not serialized

export function bnum(b :Blob) :Bnum {
    return BigInt("0x" + b.toString('hex'))
}

export function n2b(bn :Bnum) :Blob {
    return h2b(bn.toString(16))
}
