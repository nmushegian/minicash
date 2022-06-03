import { Okay, fail } from './coreword'
import {
  Tick, Move
} from './type'

export function tickIsWellFormed(tick : Tick) : Okay<Tick> {
    // length 2
    // each a list, at least one not empty
    // max 7 each move / bill
    // each move is wellformed
    // each bill is wellformed
    return fail('todo') // return tick if ok
}

export function moveIsWellFormed(move : Move) : Okay<Move> {
    return fail('todo')
}

// etc ...

// move = [rtxi sign]
// bill = [hash cash]
// tock = [prev root time fuzz]
// tack = [head neck toes]

