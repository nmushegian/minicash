import {
    Okay, okay, toss, pass, fail, need,
    Blob, Roll,
    Tick, Tock,
    Move, Bill
} from './type.js'

export {
    form_tick,
    form_tock,
}

// precondition / panic assert
// give lambda to defer eval when disabled
let _aver = true //false;
function aver(bf :((a?:any)=>boolean), s :string) {
    if (_aver && !bf()) { console.log(`PANIC`); toss(s) }
}

function isroll(x :any) :boolean {
    return islist(x) || isblob(x)
}

function islist(x :any) : boolean {
    return Array.isArray(x)
}

function isblob(x :any) : boolean {
    return Buffer.isBuffer(x)
}

function form_tock(x :Roll) :Okay<Tock> {
    aver(_=>isroll(x), `must be a roll`)
    try {
        need(islist(x), `not a list`)
	need(x.length == 4, `length is not 4`)
	for (let item of x) {
	    need(isblob(item), `item is not a blob`)
	}
	let [prev, root, time, fuzz] = x
	need((prev as Blob).length == 24, `prev must be len 24`)
	need((root as Blob).length == 24, `root must be len 24`)
	need((time as Blob).length ==  7, `time must be len 7`)
	need((fuzz as Blob).length ==  7, `fuzz must be len 7`)
	return pass(x as Tock)
    } catch (e) {
	return fail(e.message)
    }
}

function form_tick(x :Roll) :Okay<Tick> {
    aver(_=>isroll(x), `must be a roll`)
    try {
	need(islist(x), `must be a list`)
	need(x.length == 2, `must be len 2`)
	let moves = (x[0] as Roll)
	let bills = (x[1] as Roll)
	need(islist(moves), `moves must be a list`)
	need(islist(bills), `bills must be a list`)
	need(moves.length > 0 || bills.length > 0,
            `moves and bills must not both be empty`)
	need(moves.length <= 7, `moves must have len <= 7`)
	need(bills.length <= 7, `bills must have len <= 7`)
	for (let move of moves) {
	    need(islist(move), `move must be a list`)
	    move = (move as Blob[])
	    need(move.length == 3, `move must have len 3`)
	    let [txin, indx, sign] = move;
	    need(isblob(txin), `txin must be a blob`)
	    need(isblob(indx), `indx must be a blob`)
	    need(isblob(sign), `sign must be a blob`)
	    need((txin as Blob).length == 24, `txin must be len 24`)
	    need((indx as Blob).length ==  1, `indx must be len 1`)
	    need((sign as Blob).length == 32, `sign must be len 32, got ${sign.length}`)
	}
	for (let bill of bills) {
	    need(islist(bill), `bill must be a list`)
	    bill = (bill as Blob[])
	    need(bill.length == 2, `bill must have len 2`)
	    let [addr, cash] = bill
	    need(isblob(addr), `addr must be blob`)
	    need(isblob(cash), `cash must be blob`)
	    need((addr as Blob).length == 20, `addr must have len 20`)
	    need((cash as Blob).length ==  7, `cash must have len 7`)
	}
	return pass(x as Tick)
    } catch (e) {
	return fail(e.message)
    }
}
