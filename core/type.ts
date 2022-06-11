import {
    Okay, Why, okay, pass, fail,
    Blob, blob,
    Roll, roll,
    Hash, hash,
    Sign, sign,
    Pubk, scry
} from 'coreword'

export type {
    Okay, Why,
    Bnum, Blob, Roll,
    Sign, Pubk,
    Hash, Cash,
    Tick, Tock, Tack,
    Move, Bill,
    Work, Stat, Know, Snap,
    Peer, Mail,
}

export {
    okay, pass, fail,
    blob, roll,
    hash, sign, scry
}

type Tick = [
    Move[], // max 7 inputs
    Bill[]  // max 7 outputs
]
type Move = [
    Blob32, // utxo txin (input tick hash)
    Blob1,  // utxo indx (0-6)
    Blob32  // signature
]

type Bill = [
    Blob32, // pkeyhash
    Blob7   // minicash
]

type Tock = [
    Blob32, // prev  previous tockhash
    Blob32, // root  merkle root, max 2^17 leafs
    Blob32, // time  blob32 padded timestamp
    Blob32  // fuzz  miner nonce
]

type Work = Bnum  // implicit
type Cash = Bnum  // implicit
type Stat = [
    Work,  // work  cumulative work
    Cash,  // left  remaining subsidy  (initial: 2^53-1)
    Cash,  // mint  subsidy this block
]

type Snap = Blob32 // pure map snapshot

type Know
  = 'PV' // possibly-valid
  | 'DV' // definitely-valid
  | 'PN' // possibly-not-valid
  | 'DN' // definitely-not-valid

type Tack = [
    Hash   // head  tockhash this tack belongs to
  , Hash[] // neck  merkle nodes at depth 7
  , Hash[] // toes  tickhash in multiples of 1024 (last tack in tock can be <1024)
]

type Peer = Blob  // opaque peer ID
type Mail = [
    Peer,  // peer  from
    [ Blob // line  'subject' / 'route' / processing queue
    , Roll // body  payload
    ]
]

type Blob32 = Blob;
type Blob7  = Blob;
type Blob1  = Blob;
type Bnum   = BigInteger // not serialized
