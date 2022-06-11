import {
    Okay, okay, toss, pass, fail,
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

function tock_form(x :Roll) :Okay<Tock> {
    try {
	if (!islist(x)) toss(`not an array`)
	if (x.length !== 4) toss(`length is not 4`)
	for (let item of x) {
	    if (!isblob(item)) toss(`item is not a blob`)
	    if ((item as Blob).length !== 32) toss(`item is not len 32`)
	}
	return pass(x as Tock)
    } catch (e) {
	return fail(e.reason)
    }
}

function tick_form(x :Roll) :Okay<Tick> {
    try {
	if (!islist(x))     toss (`not an array`)
	if (x.length !== 2) toss(`not len 2`)
	let moves = (x[0] as Roll)
	let bills = (x[1] as Roll)
	if (!islist(moves)) toss(`moves is not a list`)
	if (!islist(bills)) toss(`bills is not a list`)
	if (moves.length == 0 && bills.length == 0)
	  { toss(`moves and bills both empty`) }
	if (moves.length > 7) toss(`more than 7 moves`)
	if (bills.length > 7) toss(`more than 7 bills`)
	for (let move of moves) {
	    okay(move_form((move as Roll)))
	}
	for (let bill of bills) {
	    okay(bill_form((bill as Roll)))
	}
	return pass(x as Tick)
    } catch (e) {
	return fail(e.reason)
    }
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
