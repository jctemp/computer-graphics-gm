import { Vector3 } from "three";
import { lerp, roundN } from "../core/utils";
import { KnotVector } from "./knotVector";

export class SplineLogic {
    /**
     * The `generateCurve` function computes `1 / resolution` points on a the bspline.
     * @param knotVector contains a list of u's
     * @param controlPoints  initial values for the curve.
     * @param degree of the polynomial segments
     * @param resolution sampling count for the curve.
     * @returns a tuple in the from of `[points, tangent, intermediates]`
     */
    public static generateCurve(knotVector: KnotVector, controlPoints: Vector3[],
        degree: number, resolution: number, _basis: number[][]): [Vector3[], Vector3[], Vector3[][][]] {

        // 1. calculate the curve points
        const curve: Vector3[] = [];
        const tangents: Vector3[] = [];
        const intermediates: Vector3[][][] = [];

        const [leftBound, rightBound] = knotVector.support(degree);
        const step = roundN((rightBound - leftBound) / resolution);

        for (let u = leftBound; u < rightBound; u += step) {
            const [_point, _tangent, _intermediates] = this.evaluatePosition(knotVector, controlPoints, degree, u);
            curve.push(_point);
            tangents.push(_tangent);
            intermediates.push(_intermediates);
        }

        return [curve, tangents, intermediates];
    }

    /**
     * The `evaluatePosition` function computes a point
     * @param knotVector the current state of knotes
     * @param controlPoints control points for the curve
     * @param degree the expected degree of polynomial segments
     * @param insertKnot requested position regarding the knot vector
     * @returns a tuple in the from of `[points, tangent, intermediates]`
     */
    public static evaluatePosition(knotVector: KnotVector, controlPoints: Vector3[],
        degree: number, insertKnot: number): [Vector3, Vector3, Vector3[][]] {
        // The first step is to determine the insertPosition of the current knot, which
        // is u ∈ [u_I, u_{I + 1}) where u is the `insertKnot`. 
        // In addition, we can retrieve the multiplicity `r` of the `insertKnot`.
        const [I, r] = knotVector.indexOf(insertKnot);

        // `intermediates` will contail the iterations of the de-boor algorithm. At this
        // stage we only want the inital points required at the r-th column of the triangle.
        // This also solve the fence post problem.
        const interm: Vector3[][] = [[]];
        const leftBound = I - degree + 1;
        for (let i = leftBound; i <= I + 1 - r; i++) {
            interm[0].push(controlPoints[i].clone());
        }

        // The first index is the iteration and the second index can be seen as the position
        // of the value inside the array. With a multiplicity greater than zero, we can skip
        // calculations. Accordingly, we reindex the b's, as an example b(1,0) with r=1 
        // becomes b(0,0).
        //
        //      r=0      r=1      r=2      r=3
        //    
        //     b(0,0) - b(1,0) - b(2,0) - b(3,0)
        //            /        /        /       
        //     b(0,1) - b(1,1) - b(2,1)
        //            /        /
        //     b(0,2) - b(1,2)
        //            /
        //     b(0,3) 
        //
        // We start at 1 because we already covered the 0-th iteration by filling the `interm`
        // vector with the initial values.
        //
        for (let k = 1, p = degree - r - 1; k <= degree - r; k++, p--) {
            interm.push([]);

            for (let j = 0; j <= degree - r - k; j++) {
                const uMin = knotVector.at(I - degree + k + j);
                const uMax = knotVector.at(I + 1 + j);
                const alpha = (insertKnot - uMin) / (uMax - uMin);

                interm[k].push(lerp(interm[k - 1][j], interm[k - 1][j + 1], alpha));
            }
        }

        const point = interm.pop()?.at(0);
        if (point === undefined) throw new Error("Point does not exists.");

        const iteration = interm.pop();
        const tangent = (iteration === undefined) ? new Vector3() :
            iteration[1].clone().sub(iteration[0]).multiplyScalar(degree);
        if (iteration !== undefined) interm.push(iteration);

        return [point, tangent, interm];
    }
}
