import {
  Blob, Roll,
  Hash, Sign,
  Pubk, Seck,
} from 'coreword'

export {
  Bnum, Blob, Roll,
  Txin, Indx, Sign,
  Cash,
  Tick, Tock, Tack,
  Work, Stat, Know,
  Tree, Desk,
  Peer, Mail,
}

type Tick     = [Move[], Bill[]]  // max 7 of each
type Move     = [Txin, Indx, Sign]  // i: [core.Hash, Blob1, core.Sign]
type Bill     = [Hash, Cash]        // o: [core.Hash, Blob7]

type Txin     = Hash    // tickhash
type Indx     = Blob1;  // max 6
type Cash     = Blob7;  // max 2^53 - 1

type Tock = [
  Hash   // prev  previous tockhash
, Hash   // root  merkle root, max 2^17 leafs
, Blob32 // time  blob32 padded timestamp
, Blob32 // fuzz  miner nonce
]

type Work = Bnum
type Stat = [
  Work   // work  cumulative work
, Cash   // left  remaining subsidy
, Cash   // mint  subsidy this block
]

type Tree = (tosh:Hash) => [Tock,Stat,Know?,Desk?]

// utxo -> [[hash, cash], burn]
type Desk = (Utxo) => [Bill, Bnum] // utxo, expiry

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


// tickhash -> tick
type TickGlob = (tickhash:Hash) => (Tick)
// tockhash,idx -> tickhash
type TackGlob = (tockhash:Hash,idx:Number) => (Hash)
// tockhash -> tock
type TockGlob = (tockhash:Hash) => (Tock)

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
type Blob1  = Blob;
type Bnum   = BigInteger // not serialized