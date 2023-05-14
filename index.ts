import {onMessage, sendMessage} from "./src/client";

const MagicCircle = {
    onMessage: onMessage,
    sendMessage: sendMessage
}

export default MagicCircle;
export * from "./src/constants";
export * from "./src/RPC";