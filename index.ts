import {findPlayer, onMessage, sendMessage, toDiceString} from "./src/client";

const MagicCircle = {
    onMessage: onMessage,
    sendMessage: sendMessage,
    findPlayer: findPlayer,
    toDiceString: toDiceString
}

export default MagicCircle;
export * from "./src/constants";
export * from "./src/RPC";
export * from "./src/Message";