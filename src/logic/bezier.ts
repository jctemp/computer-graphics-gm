import * as THREE from "three";
import { Vector3 } from "three";

export class CoordinateSystems {
    normals: Array<Array<THREE.Vector3>>;
    tangent: Array<Array<THREE.Vector3>>;
    bitangent: Array<Array<THREE.Vector3>>;

    constructor(n: Array<Array<THREE.Vector3>>, t: Array<Array<THREE.Vector3>>, b: Array<Array<THREE.Vector3>>) {
        this.normals = n;
        this.tangent = t;
        this.bitangent = b;
    }

    /**
     * @returns tuple of normal, tangent and bitangent
     */
    getLocal(s: number, t: number): [Vector3, Vector3, Vector3] {
        return [this.normals[s][t], this.tangent[s][t], this.bitangent[s][t]]
    }
}

export class BezierLogic {

    // ----------------------------------------------------------------------------------------------------------------
    //  DE CASTELJAU OPERATIONS 

    /**
     * Determines the surface based on control points represented as a 2d matrix
     * @param points 2d matrix containing the points
     * @param resolution resolution of the x and y direction
     * @returns 2d matrix containing the surface points regarding bezier curves
     */
    public static generateBezierSurface(points: Array<Array<THREE.Vector3>>, resolution: [number, number]): Array<Array<THREE.Vector3>> {
        // generate curves along x
        const xCurves: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        for (let idx = 0; idx < points.length; idx++) {
            xCurves.push(BezierLogic.generateBezierCurve(points[idx], resolution[0]));
        }

        // transpose matrix
        const xCurvesT = BezierLogic.transpose(xCurves); // res0, x.len

        // generate curve
        const xyCurves: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        for (let idx = 0; idx < xCurvesT.length; idx++) {
            xyCurves.push(BezierLogic.generateBezierCurve(xCurvesT[idx], resolution[1]));
        }

        return xyCurves;
    }

    /**
     * generateBezierSurfaceDerivates
     */
    public static generateBezierSurfaceDerivates(points: Array<Array<THREE.Vector3>>, resolution: [number, number]): CoordinateSystems {

        const xCurves: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        const xDerivates: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        for (let idx = 0; idx < points.length; idx++) {
            xCurves.push(BezierLogic.generateBezierCurve(points[idx], resolution[0]));
            xDerivates.push(BezierLogic.generateBezierCurveDerivative(points[idx], resolution[0]));
        }

        // transpose matrix
        const xCurvesT = BezierLogic.transpose(xCurves); // res0, x.len
        const xDerivatesT = BezierLogic.transpose(xDerivates);

        // generate curve
        const yxDerivates: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        const xyDerivates: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        for (let idx = 0; idx < xCurvesT.length; idx++) {
            xyDerivates.push(BezierLogic.generateBezierCurveDerivative(xCurvesT[idx], resolution[1]));
            yxDerivates.push(BezierLogic.generateBezierCurve(xDerivatesT[idx], resolution[1]));
        }

        const normalsBezierCurves: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        for (let idx = 0; idx <= resolution[0]; idx++) {
            normalsBezierCurves.push(new Array<THREE.Vector3>())
            for (let jdx = 0; jdx <= resolution[1]; jdx++) {
                normalsBezierCurves[idx].push(yxDerivates[idx][jdx].clone().cross(xyDerivates[idx][jdx]))
            }
        }

        return new CoordinateSystems(normalsBezierCurves, xyDerivates, yxDerivates);
    }

    /**
     * transpose
     */
    public static transpose(matrix: Array<Array<THREE.Vector3>>): Array<Array<THREE.Vector3>> {
        const transposed: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        for (let idx = 0; idx < matrix[0].length; idx++) {
            transposed[idx] = new Array<THREE.Vector3>();
            for (let jdx = 0; jdx < matrix.length; jdx++) {
                transposed[idx].push(matrix[jdx][idx]);
            }
        }
        return transposed;
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
            curve.push(BezierLogic.evaluatePoint(points, t));
        }
        return curve;
    }

    /**
     * Determines an approximation of a curve with n points where n = resolutions 
     * @param points control points of the curve
     * @param resolution amount of targeted points 
     * @returns Generated positions regarding the control points 
     */
    public static generateBezierCurveDerivative(points: Array<THREE.Vector3>, resolution: number): Array<THREE.Vector3> {
        const curve: Array<THREE.Vector3> = new Array<THREE.Vector3>();
        for (let idx = 0; idx <= resolution; idx++) {
            const t = idx / resolution;
            curve.push(BezierLogic.evaluateDerivative(points, t));
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
            points = BezierLogic.deCasteljauIteration(points, t);
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
            points = BezierLogic.deCasteljauIteration(points, t);
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
        while (points.length > 2) {
            points = BezierLogic.deCasteljauIteration(points, t);
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
}
