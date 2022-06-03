// valid-in-context

import {
  Okay, okay, fail,
  Tick, Tock, Cash, Stat
} from './type'

// returns total fees if OK
export function tickIsValidInContext(ctx : Tick[], tick : Tick) : Okay<Cash> {
    return fail('todo')
}

export function tockIsValidInContext(prev : Tock, tock : Tock) : Okay<Stat> {
    return fail('todo')
}