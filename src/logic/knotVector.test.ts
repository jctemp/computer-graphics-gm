import { KnotVector } from "./knotVector";

const KNOT_VECTOR = [0, 0, 0, 1, 2, 3, 3, 3];
const KNOT_VECTOR_RAND = [2, 0, 3, 0, 1, 0, 3, 3];
const KNOT_VECTOR_LENGTH = KNOT_VECTOR.length;
const KNOT_VECTOR_TUPLE: [number, number][] = [[0, 3], [1, 1], [2, 1], [3, 3]];

describe("KnotVector", () => {
    test("at", () => {
        const knotVector = new KnotVector();
        knotVector._knots = KNOT_VECTOR_TUPLE;
        knotVector.size = KNOT_VECTOR_LENGTH;

        const indices = [0, 2, 3, 4, 5, 7];
        const results = [0, 0, 1, 2, 3, 3];

        for (let idx = 0; idx < indices.length; idx++) {
            let knot = knotVector.at(indices[idx]);
            expect(knot).toEqual(results[idx]);
        }
    });

    test("indexOf", () => {
        const knotVector = new KnotVector();
        knotVector._knots = KNOT_VECTOR_TUPLE;
        knotVector.size = KNOT_VECTOR_LENGTH;

        const knots = [0, .5, 1, 10];
        const results: [number, number][] = [[2, 3], [2, 0], [3, 1], [7, 0]];

        for (let idx = 0; idx < knots.length; idx++) {
            let result = knotVector.indexOf(knots[idx]);
            expect(result).toEqual<[number, number]>(results[idx]);
        }
    });

    test("addKnot", () => {
        const knotVector = new KnotVector();
        for (const knot of KNOT_VECTOR_RAND) {
            knotVector.addKnot(knot);
        }

        expect(knotVector.size).toEqual(KNOT_VECTOR_LENGTH);
        for (let idx = 0; idx < KNOT_VECTOR_LENGTH; idx++) {
            let knot = knotVector.at(idx);
            expect(knot).toEqual(KNOT_VECTOR[idx]);
        }
    });

    test("removeKnot", () => {
        const knotVector = new KnotVector(KNOT_VECTOR);

        knotVector.removeKnot(0);
        knotVector.removeKnot(2);

        expect(knotVector.size).toEqual(KNOT_VECTOR_LENGTH - 2);
        for (let idx = 0; idx < KNOT_VECTOR_LENGTH - 2; idx++) {
            let knot = knotVector.at(idx);
            expect(knot).toEqual([0, 0, 1, 3, 3, 3][idx]);
        }
    });

    test("support", () => {
        let knotVector = new KnotVector([0, 1, 2, 3, 4, 5, 6, 7]);
        let support = knotVector.support(3);
        expect(support).toEqual<[number, number]>([2, 5]);

        knotVector = new KnotVector(KNOT_VECTOR);
        expect(knotVector.support(5)).toEqual<[number, number]>([2, 1]);
        expect(() => knotVector.support(10)).toThrow(Error);
    });

    test("controlPolygon", () => {
        let knotVector = new KnotVector(KNOT_VECTOR);
        let count = knotVector.controlPolygon(3);
        expect(count).toEqual(6);

        knotVector = new KnotVector([0,0,0,1,1,1]);
        count = knotVector.controlPolygon(3);
        expect(count).toEqual(4);

        knotVector = new KnotVector([0,1,2,3,4,5]);
        count = knotVector.controlPolygon(3);
        expect(count).toEqual(4);
    });
});