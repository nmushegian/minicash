
import { Blob, Hash, Sign } from './coreword'

export type Okay<T> = [true, T]
                    | [false, Why]
export type Why = [string, Why?] // trace

export function okay<T>(v:T) : Okay<T> {
    return [true, v]
}

export function fail(desc:string, prev?:Why) : Okay<any> {
    return [false, [desc, prev]]
}

export function toss(desc:string) {
    throw new Error(desc)
}

export type Tick = [Move[], Bill[]]  // max 7 of each
export type Move = [Utxo, Sign]
export type Utxo = Blob // 33 bytes
export type Bill = [Hash, Cash]
export type Cash = Blob // 7 bytes

export type Work = Hash
export type Fuzz = Hash
export type Root = Hash
export type Head = Hash // tockhash
export type Time = Hash

// [prev root time fuzz]
export type Tock = [Head, Root, Time, Fuzz]

// work, left, mint
export type Stat = [Work, Cash, Cash]

export type Tack = [Head, Neck, Toes]

export type Neck = Hash[] // merkle nodes at depth 7
export type Toes = Hash[] // ticks in multiples of 1024


