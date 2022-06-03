
import { Blob, Hash, Sign } from './coreword'

export type Okay<T> = T | Err
export type Err = [string, Err?] // trace

export function fail(desc:string, prev?:Err) : Okay<any> {
    return [desc, prev]
}

export function toss(desc:string) {
    throw new Error(desc)
}

export type Tick = [Move[], Bill[]]  // max 7 of each

export type Move = [Utxo, Sign]
export type Utxo = Blob33; // Hash ++ idx
// Sign = Blob64

export type Bill = [Hash, Cash]
export type Cash = Blob7;  // max 2^53 - 1
// Hash = Blob32

// [prev root time fuzz]
export type Tock = Blob32[];
export type Head = Hash   // tockhash

// implicit state
// [work left mint]
export type Stat = [Work, Cash, Cash]
export type Work = Bnum   // cumulative work

export type Tack = [Head, Neck, Toes]
export type Neck = Hash[] // merkle nodes at depth 7
export type Toes = Hash[] // ticks in multiples of 1024

type Blob64 = Blob;
type Blob33 = Blob;
type Blob32 = Blob;
type Blob7  = Blob;
type Bnum   = Blob; // unbounded, implicit state