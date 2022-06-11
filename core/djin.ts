// engine

import {
    Okay, pass, fail,
    blob,
    Hash,
    Mail
} from './type.js'

class Djin {
    best : any // best global desk from tree
    tree : any // head -> [tock,stat,know?,desk?]

    //  stat  : [work left mint]
    //  know  : PV | PN | DV | DN           // state of knowledge of block validity
    //  desk  : (txin,indx) -> [[hash cash] burn]  // burn is expiry time

    glob = {
        ticks: {} // content-addressed
      , tocks: {} // content-addressed
      , tacks: {} // almost-content-addressed, part of tockhash
    }

    //    not necessary, but useful:
    //  ticks : tickhash -> tockhash      // early dup check
    //  tocks : tockhash -> height        // faster common ancestor

    turn(mail :Mail) :Okay<Mail> {
        let [line, body] = mail

	switch (line.toString()) {

            case 'ask/tocks': {
		let init = body
		// grab tocks from glob.tocks
		let tocks = []
		return pass([blob('ans/tocks'), tocks])
	    }
            case 'ask/tacks': {
		let [tockid, tickidx] = body
		// grab tick IDs from glob.tacks
		let feet = []
		let neck = []
		return fail(`todo`)// ['ans/tacks', neck, feet]
	    }
	    case 'ask/ticks': {
		let tickids = body
		// grab ticks from glob.ticks
		let ticks = []
		return fail(`todo`)//['ans/ticks', ticks]
	    }

	    case 'ans/tocks': {
		// ...
		// tock_form
		// tock_vinx
		// add glob.tock
		// try vult_thin
		// try vult_full
		// emit ask/tacks
	    }
	    case 'ans/tacks': {
		// ...
		// tack_form
		// tack_vinx
		// add glob.tack
		// try vult_full
		// emit ask/ticks
	    }
	    case 'ans/ticks': {
		// ...
		// tick_form
		// tick_vinx
		// add glob.tick
		// later, do something smarter to know what to retry
		// for now, dumb sync will retry from ask/tocks
	    }

	    default: {
		return fail(`unrecognized mail line: ${line}`)
	    }
	}
	return fail(`panic/unreachable`)
    }

    // attempt to vult
    // get some mail out for what you need to proceed
    step(head :Hash) :Okay<Mail[]> {
	// vult_thin
	// vult_full
	return fail(`todo`)
    }
}
