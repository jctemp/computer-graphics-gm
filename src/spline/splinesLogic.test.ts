import { Vector3 } from "three";
import { lerp } from "../base/utils";
import { KnotVector } from "./knotVector";
import { LinearInterpolation, SplineLogic } from "./splinesLogic";
import { BezierCurveLogic } from "../bezier/bezierCurveLogic";

export { }

describe("SplineLogic", () => {
    test("evaluatePosition", () => {
        const controlPoints: Vector3[] = [];
        [-6, -4, -2, 0, -8, 0, 8, 4, 2].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([-10, -6, -2, -2, 0, 4, 8, 12, 16, 18]);
        const weights = [1, 1, 1, 1, 1, 1, 1, 1, 1];

        const [point, _] = LinearInterpolation.evaluatePosition(knotVector, controlPoints, weights, 2, 6);
        expect(point.x).toEqual(0);
    });

    test("generateCurve", () => {
        const controlPoints: Vector3[] = [];
        [0, 4, 8, 4].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([0, 0, 0, 1, 1, 1]);
        const weights = [1, 1, 1, 1];

        const [pointA] = SplineLogic.generateCurve(knotVector, controlPoints, weights, 3, 100);
        const [pointB] = BezierCurveLogic.generateCurve(controlPoints, 100);

        pointA.forEach((a, idx) => {
            const b = pointB[idx];
            expect(a.x).toBeCloseTo(b.x);
            expect(a.y).toBeCloseTo(b.y);
            expect(a.z).toBeCloseTo(b.z);
        });
    });

    const cP_Medium: Vector3[] = [];
        [0, 4, 8, 4, 8, 0, 8].forEach(x => {
            cP_Medium.push(new Vector3(x, 0, 0));
        });
    const kV_Medium = new KnotVector([0, 0.25, 0.25, 0.5, 0.6, 0.6, 0.8, 0.9, 1]);
    const pW_Medium = [1, 1, 1, 1, 1, 1, 1];

    test("alphaValuesSumToOne", () => {
        const [_a, _b, _c, bases] = SplineLogic.generateCurve(kV_Medium, cP_Medium, pW_Medium, 3, 100);

        bases.forEach(value => {
            let sum = 0;
            value.forEach(alpha => {
                sum += alpha;
            });
            expect(sum).toBeCloseTo(1);
        });
    });

    test("evaluatePositionsContinuity", () => {
        const degree = 3;
        const epsilon = 0.000001;
        const [leftBound, rightBound] = kV_Medium.support(degree);

        [0.25, 0.5, 0.6].forEach(value => {
            const knot = LinearInterpolation.evaluatePosition(kV_Medium, cP_Medium, pW_Medium, degree, value)[0].x;

            const upper = value + epsilon;
            if (upper < rightBound)
                expect(knot).toBeCloseTo(LinearInterpolation.evaluatePosition(kV_Medium, cP_Medium, pW_Medium, degree, upper)[0].x);

            const lower = value - epsilon;
            if (lower >= leftBound)
                expect(knot).toBeCloseTo(LinearInterpolation.evaluatePosition(kV_Medium, cP_Medium, pW_Medium, degree, lower)[0].x);
        });
    });

    test("compareMethods", () => {
        const [pointA, tangentsA, _intermA, alphasA] = SplineLogic.generateCurve(kV_Medium, cP_Medium, pW_Medium, 3, 100, true);
        const [pointB, tangentsB, _intermB, alphasB] = SplineLogic.generateCurve(kV_Medium, cP_Medium, pW_Medium, 3, 100, false);

        pointA.forEach((a, idx) => {
            const b = pointB[idx];
            expect(a.x).toBeCloseTo(b.x);
            expect(a.y).toBeCloseTo(b.y);
            expect(a.z).toBeCloseTo(b.z);
        });
        tangentsA.forEach((a, idx) => {
            // TODO if fix in cox de boor happens remove normalize
            a.normalize();
            const b = tangentsB[idx].normalize();
            expect(a.x).toBeCloseTo(b.x);
            expect(a.y).toBeCloseTo(b.y);
            expect(a.z).toBeCloseTo(b.z);
        });
        alphasA.forEach((value, jdx) => {
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

// since this takes a lot of time i commented it out. my results were
//      Linear Interpolation    = 3631 ms ,  2277 ms
//      Cox De Boor             = 6675 ms , 10351 ms 
// note: Cox De Boor without cache is approximately half as fast
describe("Timer", () => {
    test("CurveCalculationMethods", () => {
        const controlPoints: Vector3[] = [];
        [0, 4, 8, 4, 8, 0, 8].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([0, 0.25, 0.25, 0.5, 0.6, 0.6, 0.8, 0.9, 1]);
        const pW_Medium = [1, 1, 1, 1, 1, 1, 1];
        const ITERATIONS = 1000;
    
        console.time('LinearInterpolation');
        for (let i = 0; i < ITERATIONS; i++)
            SplineLogic.generateCurve(knotVector, controlPoints, pW_Medium, 3, 100, true);
        console.timeEnd('LinearInterpolation');
    
        console.time('CoxDeBoor');
        for (let i = 0; i < ITERATIONS; i++)
            SplineLogic.generateCurve(knotVector, controlPoints, pW_Medium, 3, 100, false);
        console.timeEnd('CoxDeBoor');
    });
});
