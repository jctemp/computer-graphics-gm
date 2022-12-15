import { Vector3 } from "three";
import { lerp } from "../core/utils";
import { BezierCurveLogic } from "./bezierCurveLogic";
import { KnotVector, SplineLogic } from "./splinesLogic";

const KNOT_VECTOR = [0, 0, 0, 1, 2, 3, 3, 3];

describe("KnotVector", () => {
    test("size", () => {
        const knotVector = new KnotVector(KNOT_VECTOR);
        const length = knotVector.size();
        expect(length).toEqual(8);
    });

    test("findKnot", () => {
        const knotVector = new KnotVector(KNOT_VECTOR);
        for (let idx = 0; idx < KNOT_VECTOR.length; idx++) {
            const u = knotVector.findKnot(idx);
            expect(u).toEqual(KNOT_VECTOR[idx]);
        }
    });

    test("findIndex", () => {
        const knotVector = new KnotVector(KNOT_VECTOR);
        const knots = [-1, 0, 1, 2, 3, 4];
        const results = [
            [-1, 0],
            [2, 3],
            [3, 1],
            [4, 1],
            [7, 3],
            [7, 0],
        ];
        for (let idx = 0; idx < knots.length; idx++) {
            const [I, r] = knotVector.findIndex(knots[idx]);
            expect(I).toEqual(results[idx][0]);
            expect(r).toEqual(results[idx][1]);
        }
    });

    test("insert", () => {
        const knotVector = new KnotVector(KNOT_VECTOR);

        knotVector.insert(2);
        knotVector.insert(2);
        let [I, m] = knotVector.findIndex(2);
        expect(I).toEqual(6);
        expect(m).toEqual(3);

        knotVector.insert(-1);
        [I, m] = knotVector.findIndex(-1);
        expect(I).toEqual(0);
        expect(m).toEqual(1);

        knotVector.insert(4);
        [I, m] = knotVector.findIndex(4);
        expect(I).toEqual(11);
        expect(m).toEqual(1);
    });

    test("support", () => {
        const knotVector = new KnotVector(KNOT_VECTOR);
        const degrees = [0, 1, 2, 3, 4, 5];
        const bounds = [
            [0, 3],
            [0, 3],
            [0, 3],
            [0, 3],
            [1, 2],
            [2, 1],
        ];
        degrees.forEach((degree, idx) => {
            let [lb, rb] = knotVector.support(degree);
            expect(lb).toEqual(bounds[idx][0]);
            expect(rb).toEqual(bounds[idx][1]);
        });
    });
});

describe("SplineLogic", () => {
    test("evaluatePosition", () => {
        const controlPoints: Vector3[] = [];
        [-6, -4, -2, 0, -8, 0, 8, 4, 2].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([-10, -6, -2, -2, 0, 4, 8, 12, 16, 18]);
        const [point, _] = SplineLogic.evaluatePosition(knotVector, controlPoints, 2, 6);
        expect(point.x).toEqual(0);
    });

    test("generateCurve", () => {
        const controlPoints: Vector3[] = [];
        [0, 4, 8, 4].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([0, 0, 0, 1, 1, 1]);
        const pointA = SplineLogic.generateCurve(knotVector, controlPoints, 3, 100);
        const [pointB, _] = BezierCurveLogic.generateCurve(controlPoints, 100);

        pointA.forEach((a, idx) => {
            const b = pointB[idx];
            expect(a.x).toBeCloseTo(b.x);
            expect(a.y).toBeCloseTo(b.y);
            expect(a.z).toBeCloseTo(b.z);
        });
    });

    test("generateCurve", () => {
        const controlPoints: Vector3[] = [];
        [0, 4, 8, 4, 8, 0].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([0, 0.25, 0.25, 0.5, 0.5, 0.7, 0.8, 1]);
        const [leftBound, rightBound] = knotVector.support(3);
        console.log(leftBound + " , " + rightBound)

        const epsilon = 0.000001;
        [0.25, 0.5].forEach(value => {
            const knot = SplineLogic.evaluatePosition(knotVector, controlPoints, 3, value)[0].x;
            const compareLower = SplineLogic.evaluatePosition(knotVector, controlPoints, 3, value + epsilon)[0].x;
            const compareUpper = SplineLogic.evaluatePosition(knotVector, controlPoints, 3, value - epsilon)[0].x;

            expect(knot).toBeCloseTo(compareLower);
            expect(knot).toBeCloseTo(compareUpper);
        });
    });
});

describe("Utils", () => {
    test("lerp", () => {
        const a = new Vector3(0, 0, 0);
        const b = new Vector3(1, 0, 0);
        const alphas = [0, 0.3, 0.5, 0.77, 1];
        const epsilon = 0.00001;
        alphas.forEach(value => {
            expect(lerp(a, b, value).x).toEqual(value);
            expect(lerp(a, b, value + epsilon).x).toBeCloseTo(value);
            expect(lerp(a, b, value - epsilon).x).toBeCloseTo(value);
        });
    });
})
