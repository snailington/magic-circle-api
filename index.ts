import {findPlayer, onMessage, sendMessage} from "./src/client";

const MagicCircle = {
    onMessage: onMessage,
    sendMessage: sendMessage,
    findPlayer: findPlayer
}

export default MagicCircle;
export * from "./src/constants";
export * from "./src/RPC";