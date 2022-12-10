import { Vector3 } from "three";
import { BezierCurveLogic } from "./bezierCurveLogic";

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

export class BezierSurfaceLogic {

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
            xCurves.push(BezierCurveLogic.generateBezierCurve(points[idx], resolution[0]));
        }

        // transpose matrix
        const xCurvesT = BezierSurfaceLogic.transpose(xCurves); // res0, x.len

        // generate curve
        const xyCurves: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        for (let idx = 0; idx < xCurvesT.length; idx++) {
            xyCurves.push(BezierCurveLogic.generateBezierCurve(xCurvesT[idx], resolution[1]));
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
            xCurves.push(BezierCurveLogic.generateBezierCurve(points[idx], resolution[0]));
            xDerivates.push(BezierCurveLogic.generateBezierCurveDerivative(points[idx], resolution[0]));
        }

        // transpose matrix
        const xCurvesT = BezierSurfaceLogic.transpose(xCurves); // res0, x.len
        const xDerivatesT = BezierSurfaceLogic.transpose(xDerivates);

        // generate curve
        const yxDerivates: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        const xyDerivates: Array<Array<THREE.Vector3>> = new Array<Array<THREE.Vector3>>();
        for (let idx = 0; idx < xCurvesT.length; idx++) {
            xyDerivates.push(BezierCurveLogic.generateBezierCurveDerivative(xCurvesT[idx], resolution[1]));
            yxDerivates.push(BezierCurveLogic.generateBezierCurve(xDerivatesT[idx], resolution[1]));
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
}