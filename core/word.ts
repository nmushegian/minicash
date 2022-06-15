import {
    Okay, okay, toss, pass, fail, need, aver,
    Blob, bleq, blen, isblob, h2b, b2h, chop,
    Roll, islist, isroll, roll, unroll, rmap,
    Hexs,
    Hash, hash,
    Sign, sign,
    Pubk, scry
} from 'coreword'

export type {
    Okay,
    Bnum, Blob, Roll, Byte,
    Sign, Pubk,
    Mash, Lock, Cash,
    Tick, Tock, Tack,
    Move, Bill,
    Stat, Know,
    Snap, Fees, Work,
    Peer, Mail, Memo,
    Mode,
    Hexs
}

export {
    okay, toss, pass, fail, need, aver,
    roll, unroll, rmap,
    bleq, blen, isblob, islist, isroll,
    b2h, h2b,
    mash, mosh, merk,
    sign, scry,
    memo
}

function mosh(x :Blob) :Lock {
    return chop(hash(x), 20)
}
function mash(x :Blob) :Mash {
    return chop(hash(x), 24)
}

function memo(line :string, body :Roll) :Memo {
    return [Buffer.from(line), body]
}

function _merk(x :Blob[]) :Hash {
    aver(_=> isroll(x), `panic, _merk arg is not roll`)
    aver(_=> x.length != 0, `panic, _merk arg len 0`)
    if (x.length == 1) {
        return hash(x[0])
    }
    if (x.length % 2 == 1) {
        x.push(h2b('00'.repeat(24)))
    }
    for (let i = 0; i < x.length; i += 2) { // ! +2
        x[i] = hash(Buffer.concat([x[i], x[i+1]]))
    }
    return _merk(x)
}

function merk(x :Mash[]) {
    aver(_=>{
        need(islist(x), `merk arg must be a list`)
        need(x.length > 0, `merk arg must have len > 0`)
        need(x.length <= 1024, `merk arg must have len <= 1024`)
        x.every(y => {
            need(isblob(y), `merk arg item is not a blob`)
            need(y.length == 24, `merk arg item is not a mash`)
        })
        return true
    }, `merk preconditions`)
    let ms = x
    if (x.length == 1) {
        return mash(x[0])
    } else {
        return _merk(x)
    }
}

type Tick = [
    Move[], // max 7 inputs
    Bill[]  // max 7 outputs
]
type Move = [
    Mash,  // utxo txin (input tick hash)
    Byte,  // utxo indx (0-6)
    Sign   // signature
]
type Bill = [
    Lock,  // pkeyhash
    Cash   // minicash
]

type Mash = Blob24 // content hash
type Lock = Blob20 // "address" (pubkeyhash)
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
    Lock, // address
    Cash, // amount
    Time, // expiry
    Mash, // spent by tick
    Mash  // spent in tock
]

type Stat = [
    Work,  // work  cumulative work
    Cash,  // left  remaining subsidy  (initial: 2^53-1)
    Cash,  // mint  subsidy this block
    Know,  // know  state of knowledge about validity
]

type Work = Bnum

type Snap = Blob // pure map snapshot internal representation

type Know
  = 'PV' // possibly-valid
  | 'DV' // definitely-valid
  | 'PN' // possibly-not-valid
  | 'DN' // definitely-not-valid

type Tack = [
    Tock   // head  tock these ticks belong to
  , Mash[] // neck  merkle nodes at depth 7 (empty if <1024 ticks in tock)
  , Mash[] // feet  tickhashes
]

type Peer = Blob  // opaque peer ID

type Mail = [
    Peer, // peer  from
    Memo  // memo  [line, body]  (type, data)
]

type Memo = [
    Blob, // line  type
    Roll  // body  data
]

type Blob32 = Blob;
type Blob20 = Blob;
type Blob24 = Blob;
type Blob8  = Blob;
type Blob7  = Blob;
type Blob1  = Blob;
type Bnum   = BigInteger // not serialized
