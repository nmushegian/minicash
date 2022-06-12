import {
    Okay, okay, toss, pass, fail,
    Blob, blob,
    Roll, roll, unroll,
    Hash, hash,
    Sign, sign,
    Pubk, scry
} from 'coreword'

export type {
    Okay,
    Bnum, Blob, Roll,
    Sign, Pubk,
    Mesh, Mish, Cash,
    Tick, Tock, Tack,
    Move, Bill,
    Stat, Know,
    Snap,
    Peer, Mail,
}

export {
    okay, toss, pass, fail, need, aver,
    blob, roll, unroll,
    isblob, islist, isroll,
    mesh, mish,
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

function isroll(x :any) :boolean {
    return islist(x) || isblob(x)
}

function islist(x :any) : boolean {
    return Array.isArray(x)
}

function isblob(x :any) : boolean {
    return Buffer.isBuffer(x)
}

// len 20
function mish(x :Blob) :Mish {
    return hash(x).slice(12, 32)
}
// len 24
function mesh(x :Blob) :Mesh {
    return hash(x).slice(8, 32)
}

type Tick = [
    Move[], // max 7 inputs
    Bill[]  // max 7 outputs
]
type Move = [
    Mesh,  // utxo txin (input tick hash)
    Byte,  // utxo indx (0-6)
    Sign   // signature
]
type Bill = [
    Mish,  // pkeyhash
    Cash   // minicash
]

type Mesh = Blob24 // Medi hash
type Mish = Blob20 // Mini hash
type Cash = Blob7
type Byte = Blob1


type Tock = [
    Mesh,  // prev  blob24 previous tockhash
    Mesh,  // root  blob24 merkle root, max 2^17 leafs
    Time,  // time  blob7  padded timestamp
    Fuzz   // fuzz  blob7  miner nonce
]
type Time = Blob7
type Fuzz = Blob7

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
    Mesh[]   // heads  tockhashes these tacks belong to
  , Mesh[][] // necks  merkle nodes at depth 7
  , Mesh[][] // feets  tickhash in chunks of 1024 (last tack in tock can be less)
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
