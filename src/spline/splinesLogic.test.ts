import { Vector3 } from "three";
import { KnotVector } from "./knotVector";
import { LinearInterpolation, SplineLogic } from "./splinesLogic";
import { BezierCurveLogic } from "../bezier/bezierCurveLogic";

export { }

describe("SplineLogic", () => {
    // test derived from example during the lecture. we know the value at 6 will be 0.
    test("evaluatePosition", () => {
        const controlPoints: Vector3[] = [];
        [-6, -4, -2, 0, -8, 0, 8, 4, 2].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knots = new KnotVector([-10, -6, -2, -2, 0, 4, 8, 12, 16, 18]);
        const weights = [1, 1, 1, 1, 1, 1, 1, 1, 1];

        expect(LinearInterpolation.evaluatePosition(knots, controlPoints, weights, 2, 6)[0].x).toEqual(0);
    });

    // compare the curve generated with the bezier algorithm for curves with the
    // spline algorithm's result. this works since we use a special knot sequence
    // for generation which results in the spline mimicing a bezier curve.
    test("generateBezierSpline", () => {
        const controlPoints: Vector3[] = [];
        [0, 4, 8, 4].forEach(x => {
            controlPoints.push(new Vector3(x, 0, 0));
        });
        const knotVector = new KnotVector([0, 0, 0, 1, 1, 1]);
        const weights = [1, 1, 1, 1];

        const [curveA] = SplineLogic.generateCurve(knotVector, controlPoints, weights, 3, 100);
        const [curveB] = BezierCurveLogic.generateCurve(controlPoints, 100);

        curveA.forEach((a, idx) => {
            const b = curveB[idx];
            expect(a.x).toBeCloseTo(b.x);
            expect(a.y).toBeCloseTo(b.y);
            expect(a.z).toBeCloseTo(b.z);
        });
    });

    // pre define certain values for use in later tests
    const cP_Medium: Vector3[] = [];
        [0, 4, 8, 4, 8, 0, 8].forEach(x => {
            cP_Medium.push(new Vector3(x, 0, 0));
        });
    const kV_Medium = new KnotVector([0, 0.25, 0.25, 0.5, 0.6, 0.6, 0.8, 0.9, 1]);
    const pW_Medium = [1, 1, 1, 1, 1, 1, 1];
    const degree = 3;
    const resolution = 500;

    // one time calculate curve with the improved algorithm using linear interpolation
    const [points, tangents, _interm, alphas] = SplineLogic.generateCurve(
        kV_Medium, cP_Medium, pW_Medium, degree, resolution, true);
    // one time calculate curve with the default cox de boor algorithm
    const [CoxPoints, CoxTangents, _, CoxAlphas] = SplineLogic.generateCurve(
        kV_Medium, cP_Medium, pW_Medium, degree, resolution, false);

    // test both curves generated with each algorithm to be equal. all points, tangents
    // and base functions should be equal, only the intermediates are not used here,
    // because those can not be compared to each other and will always differ.
    test("compareMethods", () => {
        points.forEach((a, idx) => {
            const b = CoxPoints[idx];
            expect(a.x).toBeCloseTo(b.x);
            expect(a.y).toBeCloseTo(b.y);
            expect(a.z).toBeCloseTo(b.z);
        });
        tangents.forEach((a, idx) => {
            // TODO if fix in cox de boor happens remove normalize
            a.normalize();
            const b = CoxTangents[idx].normalize();
            expect(a.x).toBeCloseTo(b.x);
            expect(a.y).toBeCloseTo(b.y);
            expect(a.z).toBeCloseTo(b.z);
        });
        alphas.forEach((value, jdx) => {
            value.forEach((a, idx) => {
                expect(a).toBeCloseTo(CoxAlphas[jdx][idx]);
            });
        });
    });

    // look at every point inside the alpha array and calculate, whether they always sum
    // up to 1. this must always be the case, since the curve generation is an affine
    // transformation inside the control polygon.
    test("testAlphaAffinity", () => {
        alphas.forEach(value => {
            let sum = 0;
            value.forEach(alpha => {
                sum += alpha;
            });
            expect(sum).toBeCloseTo(1);
        });
    });

    // i know this is a pretty inaccurate comparison, but it would work more precise
    // if the resolution is set to a higher number of points on the curve due to them
    // then being closer together.
    test("checkForCZero", () => {
        const precision = 1;
        points.forEach((value, idx) => {
            if (idx != 0)
                expect(value.x).toBeCloseTo(points[idx - 1].x, precision);

            if (idx != points.length - 1)
                expect(value.x).toBeCloseTo(points[idx + 1].x, precision);
        });
    });

    // outdated test for C⁰ Continuity, it would have value if the hardcoded array before
    // forEach ist updated, but since then it would in general just be the test above it's
    // computational waste
    /*
    test("evaluatePositionsContinuity", () => {
        const epsilon = 0.000001;
        const [leftBound, rightBound] = kV_Medium.support(degree);

        [0.25, 0.5, 0.6].forEach(value => {
            const knot = LinearInterpolation.evaluatePosition(
                kV_Medium, cP_Medium, pW_Medium, degree, value)[0].x;

            const upper = value + epsilon;
            if (upper < rightBound) {
                const p = LinearInterpolation.evaluatePosition(
                    kV_Medium, cP_Medium, pW_Medium, degree, upper);
                expect(knot).toBeCloseTo(p[0].x);
            }
            
            const lower = value - epsilon;
            if (lower >= leftBound) {
                const p = LinearInterpolation.evaluatePosition(
                    kV_Medium, cP_Medium, pW_Medium, degree, lower);
                expect(knot).toBeCloseTo(p[0].x);
            }
        });
    });
    */
});

// since this takes a lot of time i commented it out. my results were
//      Linear Interpolation    = 3631 ms ,  2277 ms
//      Cox De Boor             = 6675 ms , 10351 ms 
describe.skip("SplineTimer", () => {
    // general test parameter
    const iterations = 1000;

    // general curve parameter
    const controlPoints: Vector3[] = [];
    [0, 4, 8, 4, 8, 0, 8].forEach(x => {
        controlPoints.push(new Vector3(x, 0, 0));
    });
    const knots = new KnotVector([0, 0.25, 0.25, 0.5, 0.6, 0.6, 0.8, 0.9, 1]);
    const weights = [1, 1, 1, 1, 1, 1, 1];
    const degree = 3;
    const resolution = 100;

    test("timeLinearInterpolation", () => {
        console.time('LinearInterpolation');
        for (let i = 0; i < iterations; i++)
            SplineLogic.generateCurve(
                knots, controlPoints, weights, degree, resolution, true
            );
        console.timeEnd('LinearInterpolation');
    });

    // note: Cox De Boor without cache is approximately half as fast
    test("timeCoxDeBoor", () => {
        console.time('CoxDeBoor');
        for (let i = 0; i < iterations; i++)
            SplineLogic.generateCurve(
                knots, controlPoints, weights, degree, resolution, false
            );
        console.timeEnd('CoxDeBoor');
    });
});
