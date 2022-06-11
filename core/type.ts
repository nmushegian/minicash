import {
    Okay, okay, toss, pass, fail,
    Blob, blob,
    Roll, roll,
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
    okay, toss, pass, fail, need,
    blob, roll,
    mesh, mish,
    sign, scry
}

function need(b :boolean, s :string) {
    if (!b) toss(s)
}

type Mesh = Blob24 // Medi hash
type Mish = Blob20 // Mini hash
type Mash = Mish // tmp
function mish(x :Blob) :Mish {
    return hash(x).slice(12, 32)
}
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

type Byte = Blob1

type Bill = [
    Mish,  // pkeyhash
    Cash   // minicash
]

type Cash = Blob7

type Tock = [
    Mash,   // prev  previous tockhash
    Mash,   // root  merkle root, max 2^17 leafs
    Blob20, // time  blob20 padded timestamp
    Blob20  // fuzz  miner nonce
]

type Stat = [
    Bnum,  // work  cumulative work
    Bnum,  // left  remaining subsidy  (initial: 2^53-1)
    Bnum,  // mint  subsidy this block
]

type Snap = Mash // pure map snapshot

type Know
  = 'PV' // possibly-valid
  | 'DV' // definitely-valid
  | 'PN' // possibly-not-valid
  | 'DN' // definitely-not-valid

type Tack = [
    Mash   // head  tockhash this tack belongs to
  , Mash[] // neck  merkle nodes at depth 7
  , Mash[] // feet  tickhash in multiples of 1024 (last tack in tock can be <1024)
]

type Peer = Blob  // opaque peer ID
type Mail = [
    Peer,  // peer  from
    [ Blob // line  'subject' / 'route' / processing queue
    , Roll // body  payload
    ]
]

type Blob32 = Blob;
type Blob24 = Blob;
type Blob20 = Blob;
type Blob7  = Blob;
type Blob1  = Blob;
type Bnum   = BigInteger // not serialized
