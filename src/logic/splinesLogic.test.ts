import { Vector3 } from "three";
import { lerp } from "../core/utils";
import { KnotVector } from "./knotVector";
import { LinearInterpolation, SplineLogic } from "./splinesLogic";
import { BezierCurveLogic } from "./bezierCurveLogic";

export { }

describe("SplineLogic", () => {
    test("evaluatePosition", () => {
        const controlPoints: Vector3[] = [];
        [-6, -4, -2, 0, -8, 0, 8, 4, 2].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([-10, -6, -2, -2, 0, 4, 8, 12, 16, 18]);
        const [point, _] = LinearInterpolation.evaluatePosition(knotVector, controlPoints, 2, 6);
        expect(point.x).toEqual(0);
    });

    test("generateCurve", () => {
        const controlPoints: Vector3[] = [];
        [0, 4, 8, 4].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([0, 0, 0, 1, 1, 1]);
        const [pointA] = SplineLogic.generateCurve(knotVector, controlPoints, 3, 100);
        const [pointB] = BezierCurveLogic.generateCurve(controlPoints, 100);

        pointA.forEach((a, idx) => {
            const b = pointB[idx];
            expect(a.x).toBeCloseTo(b.x);
            expect(a.y).toBeCloseTo(b.y);
            expect(a.z).toBeCloseTo(b.z);
        });
    });

    test("alphaValuesSumToOne", () => {
        const controlPoints: Vector3[] = [];
        [0, 4, 8, 4, 8, 0, 8].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([0, 0.25, 0.25, 0.5, 0.6, 0.6, 0.8, 0.9, 1]);

        const [_a, _b, bases] = SplineLogic.generateCurve(knotVector, controlPoints, 3, 100);

        bases.forEach(value => {
            let sum = 0;
            value.forEach(alpha => {
                sum += alpha;
            });
            expect(sum).toBeCloseTo(1);
        });
    });

    test("evaluatePositionsContinuity", () => {
        const controlPoints: Vector3[] = [];
        [0, 4, 8, 4, 8, 0, 8].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([0, 0.25, 0.25, 0.5, 0.6, 0.6, 0.8, 0.9, 1]);

        const degree = 3;
        const epsilon = 0.000001;
        const [leftBound, rightBound] = knotVector.support(degree);

        [0.25, 0.5, 0.6].forEach(value => {
            const knot = LinearInterpolation.evaluatePosition(knotVector, controlPoints, degree, value)[0].x;

            const upper = value + epsilon;
            if (upper < rightBound)
                expect(knot).toBeCloseTo(LinearInterpolation.evaluatePosition(knotVector, controlPoints, degree, upper)[0].x);

            const lower = value - epsilon;
            if (lower >= leftBound)
                expect(knot).toBeCloseTo(LinearInterpolation.evaluatePosition(knotVector, controlPoints, degree, lower)[0].x);
        });
    });

    test("compareMehods", () => {
        const controlPoints: Vector3[] = [];
        [0, 4, 8, 4, 8, 0, 8].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([0, 0.25, 0.25, 0.5, 0.6, 0.6, 0.8, 0.9, 1]);

        const [pointA, _tangentsA, alphasA] = SplineLogic.generateCurve(knotVector, controlPoints, 3, 100, true);
        const [pointB, _tangentsB, alphasB] = SplineLogic.generateCurve(knotVector, controlPoints, 3, 100, false);

        pointA.forEach((a, idx) => {
            const b = pointB[idx];
            expect(a.x).toBeCloseTo(b.x);
            expect(a.y).toBeCloseTo(b.y);
            expect(a.z).toBeCloseTo(b.z);
        });
        alphasA.forEach((value,jdx) => {
            value.forEach((a, idx) => {
                expect(a).toBeCloseTo(alphasB[jdx][idx]);
            });
        });
    });
});

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
