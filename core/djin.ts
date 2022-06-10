// engine

import {
  Okay, pass, fail
} from 'coreword'

import {
  Mail
} from './type'

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
	switch (line.slice(0,3)) {
	  case 'ann': break;
	  case 'req': break;
	  case 'res': break;
	  default: return fail(`unrecognized mail line: ${line}`)
	}
    }
}