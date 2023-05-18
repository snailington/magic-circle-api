/******************************************************************************
**   These interfaces describe messages stored in the Magic Circle message
** buffer.  Owlbear extensions using the Magic Circle client API shouldn't
** expect to see the RPC types described in RPC.ts, but these messages are
** more specialized versions of them so consult the MsgRPC documentation for
** the rest of the fields that Messages contain.
******************************************************************************/

import {MsgRPC, RollInfo} from "./RPC";

/*
 * A human readable message of some kind, in general.
 */
export interface Message extends MsgRPC {
    // Unique, monotonically increasing, identifier for this message
    id: number,
    // Timestamp that message was sent
    time: number,
    // Name attributed to this message by the source. Often a character name.
    author: string,
    // Player ID associated with this message or undefined if player unknown
    player: string,
}

/*
 * A message containing information about a dice roll.
 */
export interface DiceMessage extends Message {
    type: "dice",
    metadata: RollInfo
}