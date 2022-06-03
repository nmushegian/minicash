import { Blob, Roll, Hash, Sign } from './coreword'
export {
  Bnum, Blob, Roll,
  Hash, Cash, Bill,
  Utxo, Sign, Move,
  Tick, Tock, Tack,
  Stat, Know,
  Peer, Mail, Memo
}

type Tick = [Move[], Bill[]]  // max 7 of each

type Move = [Utxo, Sign]
type Utxo = Blob33; // Hash ++ idx
// Sign = Blob64

type Bill = [Hash, Cash]
type Cash = Blob7;  // max 2^53 - 1
// Hash = Blob32

// [prev root time fuzz]
type Tock = Blob32[];

// implicit state
// [work left mint]
type Stat = [Bnum, Cash, Cash]
type Know = 'PV' | 'DV' | 'PN' | 'DN'

// [head neck toes]
//   head: tockhash
//   neck: merkle nodes at depth 7
//   toes: tickhash in multiples of 1024
type Tack = [Hash, Hash[], Hash[]]

type Peer = string
type Memo = string
type Mail = [Peer, [Memo, Roll]]

type Blob64 = Blob;
type Blob33 = Blob;
type Blob32 = Blob;
type Blob7  = Blob;
type Bnum   = Blob; // unbounded, implicit state