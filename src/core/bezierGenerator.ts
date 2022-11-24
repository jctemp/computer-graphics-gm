import * as THREE from "three";

export class BezierGenerator {

    // ----------------------------------------------------------------------------------------------------------------
    //  DE CASTELJAU OPERATIONS 

    /**
     * Determines the surface based on control points represented as a 2d matrix
     * @param points 2d matrix containing the points
     * @param resolution resolution of the x and y direction
     * @returns 2d matrix containing the surface points regarding bezier curves
     */
    public static generateBezierSurface(points: Array<Array<THREE.Vector3>>, resolution: [number, number]): Array<Array<THREE.Vector3>> {
        const xBezierCurves: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        for (let idx = 0; idx < points.length; idx++) {
            xBezierCurves.push(BezierGenerator.generateBezierCurve(points[idx], resolution[0]));
        }

        const yBezierCurves: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        for (let idx = 0; idx < xBezierCurves[0].length; idx++) {
            yBezierCurves[idx] = new Array<THREE.Vector3>();
            for (let jdx = 0; jdx < xBezierCurves.length; jdx++) {
                yBezierCurves[idx].push(xBezierCurves[jdx][idx]);
            }
        }

        const xyBezierCurves: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        for (let idx = 0; idx < yBezierCurves.length; idx++) {
            xyBezierCurves.push(BezierGenerator.generateBezierCurve(yBezierCurves[idx], resolution[1]));
        }

        return xyBezierCurves;
    }

    /**
     * Determines an approximation of a curve with n points where n = resolutions 
     * @param points control points of the curve
     * @param resolution amount of targeted points 
     * @returns Generated positions regarding the control points 
     */
    public static generateBezierCurve(points: Array<THREE.Vector3>, resolution: number): Array<THREE.Vector3> {
        const curve: Array<THREE.Vector3> = new Array<THREE.Vector3>();
        for (let idx = 0; idx <= resolution; idx++) {
            const t = idx / resolution;
            curve.push(BezierGenerator.evaluatePoint(points, t));
        }
        return curve;
    }

    /**
     * Finds a convex combination which is a point on a curve with degree positions-1
     * @param points control points of the curve
     * @param t weight to determine a point (Note: assumed is a normalised value [0,1])
     * @returns point p_t on the curve. 
     */
    public static evaluatePoint(points: Array<THREE.Vector3>, t: number): THREE.Vector3 {
        while (points.length > 1) {
            points = BezierGenerator.deCasteljauIteration(points, t);
        }
        return points[0];
    }

    /**
     * Finds the derivate of the curve at a position p.
     * @param points control points of the curve
     * @param t weight to determine a point (Note: assumed is a normalised value [0,1])
     * @returns the derivate at the point p_t on the curve. 
     */
    public static evaluateDerivative(points: Array<THREE.Vector3>, t: number): THREE.Vector3 {
        const n = points.length - 1;
        while (points.length > 2) {
            points = BezierGenerator.deCasteljauIteration(points, t);
        }
        return points[1].sub(points[0]).multiplyScalar(n);
    }

    /**
     * Determines intermediate values of the deCasteljau algorithm.
     * @param points control points of the curve
     * @param t weight to determine a point (Note: assumed is a normalised value [0,1])
     */
    public static calculateIntermediates(points: Array<THREE.Vector3>, t: number): Array<Array<THREE.Vector3>> {
        const iterations = new Array<Array<THREE.Vector3>>();
        while (points.length > 1) {
            points = BezierGenerator.deCasteljauIteration(points, t);
            iterations.push(new Array(...points));
        }
        return iterations;
    }

    /**
     * Lerping the control points to the given time t and writing the result to the new array.
     * It is a generalised form for n control points.
     * @param points control points of the curve
     * @param t weight to determine a point (Note: assumed is a normalised value [0,1])
     */
    private static deCasteljauIteration(points: Array<THREE.Vector3>, t: number): Array<THREE.Vector3> {
        let result = new Array<THREE.Vector3>();
        for (let i = 0; i < points.length - 1; i++)
            result.push(points[i + 1].clone().sub(points[i]).multiplyScalar(t).add(points[i]));
        return result;
    }

    // ----------------------------------------------------------------------------------------------------------------
    //  POLYNOMIAL BASIS OPERATIONS 

    /**
     * Calculates the Bernstein polynomial function of a basis degree n
     * @param degree of the desired polynomials
     */
    public static evaluateBasisFunctions(pointsCount: number, resolution: number): Array<Array<number>> {
        const baseFunctions = Array<Array<number>>();
        for (let idx = 0; idx < pointsCount; idx++) {
            baseFunctions.push(Array<number>())
        }

        for (let idx = 0; idx <= resolution; idx++) {
            const t = idx / resolution;
            const coefficients = BezierGenerator.calculateCoefficients(pointsCount - 1, t);
            for (let jdx = 0; jdx < pointsCount; jdx++) {
                baseFunctions[jdx].push(coefficients[jdx]);
            }
        }
        return baseFunctions;
    }

    /**
     * Weight the contribution of controlpoints by calculating the values of the different terms of the
     * Bernstein polynome.
     * @param n The degree of the polynomial basis
     * @param t weight to determine a point (Note: assumed is a normalised value [0,1])
     * @returns the coefficient values of the the polynomials
     */
    public static calculateCoefficients(n: number, t: number): Array<number> {
        let coefficients = new Array<number>();
        for (let j = 0; j <= n; j++) {
            coefficients.push(
                BezierGenerator.binomial(n, j) *    // n over k
                (t ** j) *                               // t^j
                ((1 - t) ** (n - j)) // (1-t)^(n-j)
            );
        }
        return coefficients;
    }

    /**
     * Calculates the binomial coefficients.
     */
    private static binomial(n: number, k: number): number {
        let coefficient = 1;
        for (let x = n - k + 1; x <= n; x++) {
            coefficient *= x;
        }

        for (let x = 1; x <= k; x++) {
            coefficient /= x;
        }

        return coefficient;
    }
}
