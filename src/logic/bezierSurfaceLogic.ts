import { Vector3 } from "three";
import { BezierCurveLogic } from "./bezierCurveLogic";

export class BezierSurfaceLogic {

    /**
     * `generateSurface` computes the bezier surface for a set of control points.
     * @param controlPoints 2d grid of control points
     * @param resolution desired sampling for x and y direction
     * @returns a tuple of the from `[positions, normals, tangents, bitangents]`
     */
    public static generateSurface(controlPoints: Vector3[][], resolution: [number, number]) {

        const xCurves: Vector3[][] = [];
        const xTangents: Vector3[][] = [];
        for (let idx = 0; idx < controlPoints.length; idx++) {
            const [currentPosition, currentTangent] = BezierCurveLogic.generateCurve(
                controlPoints[idx], resolution[0]);
            xCurves.push(currentPosition);
            xTangents.push(currentTangent);
        }

        // We transpose the 2d arrays because to generate a curve the `generateCurve`
        // function demands an array. This is simply an upfront calculation for the
        // next step. This allows us to make the code more readable and indexing
        // straightfoward.
        const xCurvesT = BezierSurfaceLogic.transpose(xCurves);
        const xTangentsT = BezierSurfaceLogic.transpose(xTangents);

        const bitangents: Vector3[][] = [];
        const tangents: Vector3[][] = [];
        const positions: Vector3[][] = [];

        for (let idx = 0; idx < xCurvesT.length; idx++) {
            const [currentPosition, currentTangent] = BezierCurveLogic.generateCurve(
                xCurvesT[idx], resolution[1]);
            positions.push(currentPosition);
            tangents.push(currentTangent);

            // At this stage we can abuse the structure of the 2d bezier calculation.
            // Running the curveGeneration over the xTangents yields us the correct
            // value for the final tangents of the surface. This approach allows us
            // to save some calculations. 
            bitangents.push(BezierCurveLogic.generateCurveWithoutTangents(
                xTangentsT[idx], resolution[1]));
        }

        const xyNormals: Vector3[][] = [];
        for (let idx = 0; idx <= resolution[0]; idx++) {
            xyNormals.push([]);
            for (let jdx = 0; jdx <= resolution[1]; jdx++) {
                xyNormals[idx].push(bitangents[idx][jdx].clone()
                    .cross(tangents[idx][jdx]));
            }
        }

        return [positions, xyNormals, tangents, bitangents];
    }

    /**
     * `transpose` is a private utility function which swaps columns
     * and rows of a 2d matrix. Its main purpose in this context is to
     * have simpler indexing.
     */
    private static transpose(matrix: Vector3[][]): Vector3[][] {
        const transposed: Vector3[][] = [];
        for (let idx = 0; idx < matrix[0].length; idx++) {
            transposed[idx] = [];
            for (let jdx = 0; jdx < matrix.length; jdx++) {
                transposed[idx].push(matrix[jdx][idx]);
            }
        }
        return transposed;
    }
}