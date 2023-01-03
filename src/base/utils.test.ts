import { Vector3 } from "three";
import { lerp } from "../base/utils";

export { }

describe("Utils", () => {
    test("lerp", () => {
        const a = new Vector3(0, 0, 0);
        const b = new Vector3(1, 0, 0);

        const epsilon = 0.00001;
        [0, 0.3, 0.5, 0.77, 1].forEach(value => {
            expect(lerp(a, b, value).x).toEqual(value);
            expect(lerp(a, b, value + epsilon).x).toBeCloseTo(value);
            expect(lerp(a, b, value - epsilon).x).toBeCloseTo(value);
        });
    });
});
