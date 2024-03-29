import {
    Okay, okay, toss, pass, fail, need, aver, err,
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
    Know, Time,
    Snap, Fees, Work,
    Peer, Mail, Memo,
    OpenMemo, MemoErr,
    MemoAskTicks, MemoAskTack, MemoAskTock,
    MemoSayTicks, MemoSayTack, MemoSayTock,
    Mode,
    Hexs
}

export {
    okay, toss, pass, fail, need, aver, err,
    roll, unroll, rmap,
    bleq, blen, bcat,
    isblob, islist, isroll,
    b2h, h2b, t2b, b2t,
    mash, addr, merk,
    sign, scry,
    memo,
    MemoType,// enum export as value not type
    memo_open,
    memo_close,
    extend
}

function t2b(x :string) :Blob {
    return Buffer.from(x)
}

function b2t(x :Blob) :string {
    return x.toString()
}

function bcat(...args :Blob[]) :Blob {
    return Buffer.concat(args)
}

function addr(x :Blob) :Code {
    return chop(hash(x), 20)
}
function mash(x :Blob) :Mash {
    return chop(hash(x), 24)
}

function extend(x :Blob, n) :Blob {
    let head = n - x.length
    if (head > 0) {
        return Buffer.concat([Buffer.from('00'.repeat(head), 'hex'), x])
    }
    return x
}

function memo_open(m :Memo) :OpenMemo {
    let line = m[0][0]
    return [m[0][0], m[1]] as OpenMemo
}

function memo_close(m :OpenMemo) :Memo {
    return [Buffer.from([m[0]]), m[1]] as Memo
}

function memo(line :MemoType, body :Roll) :Memo {
    return [Buffer.from([line]), body]
}


function _merk(x :Mash[]) :Mash {
    aver(_=> isroll(x), `_merk arg must be a roll`)
    aver(_=> x.length != 0, `_merk arg list must not be empty`)
    aver(_=> x.every(b => isblob(b)), `_merk arg list item must be a blob`)
    aver(_=> x.every(b => b.length == 24), `_merk arg list item must be len 24`)
    if (x.length == 1) {
        return x[0]
    }
    let extended = x.length % 2 == 1
    if (extended) {
        x.push(h2b('00'.repeat(24)))
    }
    let hops = []
    for (let i = 0; i < x.length; i += 2) { // ! +2
        hops.push(mash(Buffer.concat([x[i], x[i+1]])))
    }
    if (extended) {
        x.pop()
    }
    return _merk(hops)
}

function merk(x :Mash[]) :Mash {
    aver(_=>{
        need(islist(x), `merk arg must be a list`)
        need(x.length > 0, `merk arg must have len > 0`)
        need(x.length <= 1024, `merk arg must have len <= 1024, use chunks`)
        x.every(y => isblob(y), `merk arg item is not a blob`)
        return true
    }, `merk preconditions`)
    return _merk(x)
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

type Pent = [
    Mash, // spent by tick
    Mash  // spent in tock
]

type Fold = [
    Snap, // partial utxo
    Cash, // net fees
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
  , Byte   // eye   which chunk is in this tack (ticks eye*1024 thru (eye+1)*1024)
  , Mash[] // ribs  chunk roots (merkle nodes at depth 7, empty if <1024 ticks in tock)
  , Mash[] // feet  tickhashes
]

type Peer = Roll  // opaque peer ID, can be just a blob, or can carry more info
type Mail = [
    Peer, // peer  from
    Memo  // memo  [line, body]  (type, data)
]

type Line = Blob  // message type
type Memo = [
    Line, // line  type
    Roll  // body  data
]

type OpenMemo
  = MemoAskTock
  | MemoAskTack
  | MemoAskTicks
  | MemoSayTock
  | MemoSayTack
  | MemoSayTicks
  | MemoErr


// MemoType is a typescript-level enum definition whose values
// are js `number` types. This is not the representation in the protocol,
// where these values are one-byte `Blob`s. The reason we define this enum
// is that it lets us use typescript's type system with concrete value cases,
// which is only supported for `string` and `number`.
// Remember that `MemoType` (with numbers) and `OpenMemo` are implementation details,
// whereas `Memo` (a roll, that means only blobs as leafs) is part of the core wire format.
// In javascript, converting a MemoType to a Memo's `line` (item 0), which is a blob,bbbbbb
// is done with `Buffer.from( [ tag ] )`,  notice the argument is a list of bytes (length 1).
// Your well-formed check should check the *actual concrete byte values*, do not use your
// type system until after you check your form.
enum MemoType {  // mnemonic
    AskTock  = 0xa0,  // Ask t0ck
    AskTack  = 0xaa,  // Ask tAck
    AskTicks = 0xa1,  // Ask t1cks
    SayTock  = 0xc0,  //~Say t0ck
    SayTack  = 0xca,  //~Say tAck
    SayTicks = 0xc1,  //~Say t1cks
    Err      = 0xee,  // Err
}

type MemoAskTock
  =  [MemoType.AskTock, Mash]          // get next tock after this one, in best chain
type MemoAskTack
  =  [MemoType.AskTack, [Mash, Blob] ] // get tack for [tockhash,idx]
type MemoAskTicks
  =  [MemoType.AskTicks, Mash[]]       // tickhashes you want ticks for

type MemoSayTock
  =  [MemoType.SayTock, Tock]          // tock you requested
type MemoSayTack
  =  [MemoType.SayTack, Tack]          // tack you requested
type MemoSayTicks
  =  [MemoType.SayTicks, Tick[]]       // ticks you requested
type MemoErr
  =  [MemoType.Err, Roll]              // typed reason, untyped subreason

type Blob32 = Blob;
type Blob20 = Blob;
type Blob24 = Blob;
type Blob8  = Blob;
type Blob7  = Blob;
type Blob1  = Blob;
type Bnum   = bigint // not serialized

export function bnum(b :Blob) :Bnum {
    need(b.length > 0, `bnum arg must be len > 0`)
    return BigInt("0x" + b.toString('hex'))
}

export function n2b(bn :Bnum) :Blob {
    need(bn !== undefined, `bnum arg must be defined`)
    return h2b(bn.toString(16))
}
