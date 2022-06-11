import {
    Okay, Why, pass, fail,
    Blob, Roll,
    Tick, Tock,
    Move, Bill
} from './type.js'

export {
    tick_form,
    tock_form,
    move_form,
    bill_form
}

function islist(x :any) : boolean {
    return Array.isArray(x)
}

function isblob(x :any) : boolean {
    return Buffer.isBuffer(x)
}

function tock_form(x :Roll) : Okay<Tock> {
    if (!islist(x)) return fail(`not an array`)
    if (x.length !== 4) return fail(`length is not 4`)
    for (let item of x) {
	if (!isblob(item)) return fail(`item is not a blob`)
	if ((item as Blob).length !== 32) return fail(`item is not len 32`)
    }
    return pass(x as Tock)
}

function tick_form(x :Roll) :Okay<Tick> {
    if (!islist(x))     return fail(`not an array`)
    if (x.length !== 2) return fail(`not len 2`)
    let moves = (x[0] as Roll)
    let bills = (x[1] as Roll)
    if (!islist(moves))  return fail(`moves is not a list`)
    if (!islist(bills))  return fail(`bills is not a list`)
    if (moves.length == 0 && bills.length == 0)
	return fail(`moves and bills both empty`)
    if (moves.length > 7) return fail(`more than 7 moves`)
    if (bills.length > 7) return fail(`more than 7 bills`)
    for (let move of moves) {
	let [ok, why] = move_form((move as Roll))
	if (!ok) return fail(`malformed move`, (why as Why))
    }
    for (let bill of bills) {
	let [ok, why] = bill_form((bill as Roll))
	if (!ok) return fail(`malformed bill`, (why as Why))
    }
    return pass(x as Tick)
}

function move_form(x :Roll) :Okay<Move> {
    if (!islist(x))     return fail(`not a list`)
    if (x.length !== 3) return fail(`not len 3`)
    let [txin, indx, sign] = x;
    if (!isblob(txin))  return fail(`txin not a blob`)
    if (!isblob(indx))  return fail(`indx not a blob`)
    if (!isblob(sign))  return fail(`sign not a blob`)
    if ((txin as Blob).length !== 20) return fail(`txin wrong length`)
    if ((indx as Blob).length !==  1) return fail(`indx wrong length`)
    if ((sign as Blob).length !== 32) return fail(`sign wrong length`)
    return pass(x as Move)
}

function bill_form(x :Roll) :Okay<Bill> {
    if (!islist(x))     return fail(`not a list`)
    if (x.length !== 2) return fail(`not len 2`)
    let [addr, cash] = x
    if (!isblob(addr)) return fail(`addr not a blob`)
    if (!isblob(cash)) return fail(`cash not a blob`)
    if ((addr as Blob).length !== 20) return fail(`addr wrong length`)
    if ((cash as Blob).length !== 7)  return fail(`cash wrong length`)
    return pass(x as Bill)
}
