import {onMessage} from "./src/client";

const MagicCircle = {
    onMessage: onMessage,
}

export default MagicCircle;
export * from "./src/constants";
export * from "./src/RPC";