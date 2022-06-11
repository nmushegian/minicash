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
    Mash, Cash,
    Tick, Tock, Tack,
    Move, Bill,
    Stat, Know,
    Snap,
    Peer, Mail,
}

export {
    okay, toss, pass, fail,
    blob, roll,
    mash, sign, scry
}

type Mash = Blob20 // last 20 bytes of `hash`
function mash(x :Blob) :Mash {
    return hash(x).slice(12, 32)
}

// strip leading zeros
function zcut(x :Blob) :Blob {
    if (x.length == 0) return x;
    if (x[0] == 0) return zcut(x.slice(1))
    return x
}

// pad with zeros up to length k
function zpad(x :Blob, k :number) :Blob {
    if (x.length > k) throw new Error(`panic: zpad(x.length > k)`)
    if (x.length < k) {
	return Buffer.concat([
	    blob('00'.repeat(k - x.length)),
	    x
	])
    } else return x
}

type Tick = [
    Move[], // max 7 inputs
    Bill[]  // max 7 outputs
]
type Move = [
    Intx,  // utxo txin (input tick hash)
    Indx,  // utxo indx (0-6)
    Sign   // signature
]

type Intx = Mash
type Indx = Blob1

type Bill = [
    Mash,  // pkeyhash
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
type Blob20 = Blob;
type Blob7  = Blob;
type Blob1  = Blob;
type Bnum   = BigInteger // not serialized
