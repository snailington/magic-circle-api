import {MsgRPC} from "./RPC";

// A message stored in the Magic Circle message bus
export interface Message extends MsgRPC {
    // Unique, monotonically increasing, identifier for this message
    id: number,
    // Timestamp that message was sent
    time: number,
    // The player associated with this message or undefined if player unknown
    player: string | undefined,
}