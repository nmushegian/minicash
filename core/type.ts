import {
  Blob, Roll,
  Hash, Sign,
  Pubk, Seck,
} from 'coreword'

export {
  Bnum, Blob, Roll,
  Hash, Cash, Bill,
  Utxo, Sign, Move,
  Tick, Tock, Tack,
  Stat, Know,
  Peer, Mail
}

type Tick     = [Move[], Bill[]]  // max 7 of each
type Move     = [Utxo, Sign]  // input  [Blob33, core.Sign]
type Bill     = [Hash, Cash]  // output [core.Hash, Blob7]

type Utxo     = Blob33;  // Hash ++ idx
type Cash     = Blob7;   // max 2^53 - 1

type Tock = [
  Hash   // prev  previous tockhash
, Hash   // root  merkle root, max 2^17 leafs
, Blob32 // time  blob32 padded timestamp
, Blob32 // fuzz  miner nonce
]

type Stat = [
  Bnum   // work  cumulative work
, Cash   // left  remaining subsidy
, Cash   // mint  subsidy this block
]

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

type Blob65 = Blob;
type Blob33 = Blob;
type Blob32 = Blob;
type Blob7  = Blob;
type Bnum   = Blob; // unbounded, implicit state