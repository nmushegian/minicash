import { Okay, fail, Roll } from './coreword'
import { Tick, Move } from './type'

export {
    tickform,
    moveform
}

function tickform(roll : Roll) : Okay<Tick> {
    // length 2
    // each a list, at least one not empty
    // max 7 each move / bill
    // each move is wellformed
    // each bill is wellformed
    return fail('todo') // return tick if ok
}

function moveform(move : Move) : Okay<Move> {
    return fail('todo')
}

// etc ...

// move = [rtxi sign]
// bill = [hash cash]
// tock = [prev root time fuzz]
// tack = [head neck toes]

