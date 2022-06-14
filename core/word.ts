import {
    Okay, okay, toss, pass, fail,
    Blob, blob,
    Roll, roll, unroll, rmap,
    Hexs,
    Hash, hash,
    Sign, sign,
    Pubk, scry
} from 'coreword'

export type {
    Okay,
    Bnum, Blob, Roll,
    Sign, Pubk,
    Mash, Lock, Cash,
    Tick, Tock, Tack,
    Move, Bill,
    Stat, Know,
    Snap, Fees,
    Peer, Mail,
}

export {
    okay, toss, pass, fail, need, aver,
    blob, roll, unroll, rmap,
    isblob, islist, isroll,
    b2h, h2b,
    mash, mosh,
    sign, scry
}

function need(b :boolean, s :string) {
    if (!b) toss(s)
}

// precondition / panic assert
// give lambda to defer eval when disabled
let _aver = true //false;
function aver(bf :((a?:any)=>boolean), s :string) {
    if (_aver && !bf()) { console.log(`PANIC`); toss(s) }
}

function b2h(blob : Blob) :Hexs {
    return blob.toString('hex')
}

function h2b(hexs :Hexs) :Blob {
    return Buffer.from(hexs, 'hex')
}

function isroll(x :any) :boolean {
    if (isblob(x)) return true;
    if (islist(x)) {
        if (x.length == 0) return true;
        if (x.filter(r=>isroll(r)).length > 0) return true;
    }
    return false
}

function islist(x :any) : boolean {
    return Array.isArray(x)
}

function isblob(x :any) : boolean {
    return Buffer.isBuffer(x)
}

function chop(x :Blob, k :number) :Blob {
    need(x.length >= k, `chop: x.len must be <= k`)
    return x.slice(x.length - k, x.length)
}

function mosh(x :Blob) :Lock {
    return chop(hash(x), 20)
}
function mash(x :Blob) :Mash {
    return chop(hash(x), 24)
}

function _merk(x :Blob[]) :Hash {
    aver(_=> isroll(x), `panic, _merk arg is not roll`)
    aver(_=> x.length != 0, `panic, _merk arg len 0`)
    if (x.length == 1) {
        return hash(x[0])
    }
    if (x.length % 2 == 1) {
        x.push(blob('00'.repeat(24)))
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

type Mash = Blob24 // Medi hash
type Lock = Blob20 // "address" (pubkeyhash)
type Cash = Blob7
type Byte = Blob1


type Tock = [
    Mash,  // prev  blob24 previous tockhash
    Mash,  // root  blob24 merkle root, max 2^17 leafs
    Time,  // time  blob7  padded timestamp
    Fuzz   // fuzz  blob7  miner nonce
]
type Time = Blob7
type Fuzz = Blob
7
type Fees = Bnum

type Stat = [
    Bnum,  // work  cumulative work
    Bnum,  // left  remaining subsidy  (initial: 2^53-1)
    Bnum,  // mint  subsidy this block
]

type Snap = Blob // pure map snapshot internal representation

type Know
  = 'PV' // possibly-valid
  | 'DV' // definitely-valid
  | 'PN' // possibly-not-valid
  | 'DN' // definitely-not-valid

// tick can be in more than one (candidate) tack
// tack can be in more than one (candidate) tock
type Tack = [
    Mash   // head  tockhash these tacks belongs to
  , Mash[] // neck  merkle nodes at depth 7 (empty if <1024 ticks in tock)
  , Mash[] // feet  tickhash in chunks of 1024 (last tack in tock can be less)
]

type Peer = Blob  // opaque peer ID
type Mail = [
    Peer,  // peer  from
    [ Blob // line  'subject' / 'route' / processing queue
    , Roll // body  payload
    ]
]

type Blob32 = Blob;
type Blob20 = Blob;
type Blob24 = Blob;
type Blob8  = Blob;
type Blob7  = Blob;
type Blob1  = Blob;
type Bnum   = BigInteger // not serialized
