// valid-in-context
import { Okay, fail } from './coreword'
import {
  Tick, Tock, Cash, Stat
} from './type'

// context is set of ticks that contain bills being moved
// do not worry about internal consistency of context at this step
// returns total fees if ok
export function tickvinx(ctx : Tick[], tick : Tick) : Okay<Cash> {
    return fail('todo')
}

// context is previous tock
export function tockvinx(prev : Tock, tock : Tock) : Okay<Stat> {
    return fail('todo')
}