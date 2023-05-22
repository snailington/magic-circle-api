import {toDiceString} from "../src/client"
import {RollInfo} from "../src/RPC";

test("dice 1d20", () => {
    const diceString = toDiceString({
        kind: "test",
        dice: [20],
        suffix: ""
    });
    
    expect(diceString).toBe("1d20");
});

test("dice 1d20+2", () => {
    const diceString = toDiceString({
        kind: "test",
        dice: [20],
        suffix: "+2"
    });

    expect(diceString).toBe("1d20+2");
});

test("dice 6d20", () => {
    const diceString = toDiceString({
        kind: "test",
        dice: [20, 20, 20, 20, 20, 20],
        suffix: ""
    });
    
    expect(diceString).toBe("6d20");
});

test("dice 2d10 3d20", () => {
    const diceString = toDiceString({
        kind: "test",
        dice: [10, 20, 20, 10, 20],
        suffix: ""
    });
    
    expect(diceString).toBe("2d10 3d20");
});