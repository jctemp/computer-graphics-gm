import * as THREE from "three";
import { Vector3 } from "three";

export class BezierCurveLogic {


    /**
     * Determines an approximation of a curve with n points where n = resolutions 
     * @param points control points of the curve
     * @param resolution amount of targeted points 
     * @returns Generated positions regarding the control point
     * @deprecated
     */
    public static generateBezierCurve(points: Array<THREE.Vector3>, resolution: number): Array<THREE.Vector3> {
        const curve: Array<THREE.Vector3> = new Array<THREE.Vector3>();
        for (let idx = 0; idx <= resolution; idx++) {
            const t = idx / resolution;
            curve.push(BezierCurveLogic.evaluatePoint(points, t));
        }
        return curve;
    }

    /**
     * Determines an approximation of a curve with n points where n = resolutions 
     * @param points control points of the curve
     * @param resolution amount of targeted points 
     * @returns Generated positions regarding the control points
     * @deprecated
     */
    public static generateBezierCurveDerivative(points: Array<THREE.Vector3>, resolution: number): Array<THREE.Vector3> {
        const curve: Array<THREE.Vector3> = new Array<THREE.Vector3>();
        for (let idx = 0; idx <= resolution; idx++) {
            const t = idx / resolution;
            curve.push(BezierCurveLogic.evaluateDerivative(points, t));
        }
        return curve;
    }

    /**
     * Finds a convex combination which is a point on a curve with degree positions-1
     * @param points control points of the curve
     * @param t weight to determine a point (Note: assumed is a normalised value [0,1])
     * @returns point p_t on the curve. 
     * @deprecated
     */
    public static evaluatePoint(points: Array<THREE.Vector3>, t: number): THREE.Vector3 {
        while (points.length > 1) {
            points = BezierCurveLogic.deCasteljauIteration(points, t);
        }
        return points[0];
    }

    /**
     * Finds the derivate of the curve at a position p.
     * @param points control points of the curve
     * @param t weight to determine a point (Note: assumed is a normalised value [0,1])
     * @returns the derivate at the point p_t on the curve. 
     * @deprecated
     */
    public static evaluateDerivative(points: Array<THREE.Vector3>, t: number): THREE.Vector3 {
        const n = points.length - 1;
        while (points.length > 2) {
            points = BezierCurveLogic.deCasteljauIteration(points, t);
        }
        return points[1].sub(points[0]).multiplyScalar(n);
    }

    /**
     * The `generateCurve` function computes `1 / resolution` points on a bezier curve.
     * @param controlPoints initial values for the curve.
     * @param resolution sampling count for the curve.
     * @returns a tuple in the form `[points, tangents, intermediates]`
     */
    public static generateCurve(controlPoints: Vector3[], resolution: number): [Vector3[], Vector3[], Vector3[][][]] {
        const points: Vector3[] = [];
        const tangents: Vector3[] = [];
        const intermediates: Vector3[][][] = [];

        for (let idx = 0; idx <= resolution; idx++) {
            const t = idx / resolution;
            const [point, tangent, iterations] = BezierCurveLogic.evaluatePosition(controlPoints, t)

            points.push(point);
            tangents.push(tangent);
            intermediates.push(iterations);
        }

        return [points, tangents, intermediates];
    }

    /**
     * The `evaluatePosition` function computes a point with tangent and intermediates by utilsing
     * the de casteljau algorithm.
     * @param controlPoints initial values for the curve.
     * @param t a value in the interval `[0,1]`
     * @returns a tuple in the form `[point, tangent, iterations]`
     */
    public static evaluatePosition(controlPoints: Vector3[], t: number): [Vector3, Vector3, Vector3[][]] {
        // The amount of control points correspond to the order of the curve. Accordingly,
        // we can derive the degree that is used later for the derivative.
        const degree = controlPoints.length - 1;

        // We do the de casteljau algorithm n times until we have no points left in
        // the list. At the same, we cache the iterations (intermediates), to allow
        // other computations like the derivative at the point p. The last value inside the
        // iterations array is the targeted point itself.
        const iterations: Vector3[][] = [];
        while (controlPoints.length > 1) {
            controlPoints = BezierCurveLogic.deCasteljauIteration(controlPoints, t);
            iterations.push([...controlPoints]);
        }
        const point = iterations.pop()?.at(0);
        if (point === undefined) throw new Error("Evaluate position: no point calculated.");


        // Computing the derivative requires the last iteration. We take the difference and
        // multiply the intermediate result with the curve's degree.
        const iteration = iterations.pop();
        if (iteration === undefined) throw new Error("Evaluate position: no previous iteration.");
        const tangent = iteration[1].clone().sub(iteration[0]).multiplyScalar(degree);
        iterations.push(iteration);

        return [point, tangent, iterations];
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
}
