import { Vector3 } from "three";
import { lerp, roundN } from "../core/utils";
import { KnotVector } from "./knotVector";

// // @NICK
// import { pascalRow } from "../core/utils";


export class SplineLogic {
    /**
     * The `generateCurve` function computes `1 / resolution` points on a the bspline.
     * @param knotVector contains a list of u's
     * @param controlPoints  initial values for the curve.
     * @param degree of the polynomial segments
     * @param resolution sampling count for the curve.
     * @returns a tuple in the from of `[points, intermediates]`
     */
    public static generateCurve(knotVector: KnotVector, controlPoints: Vector3[],
        degree: number, resolution: number): [Vector3[], Vector3[], number[][]] {

        // 1. calculate the curve points
        const curve: Vector3[] = [];
        const tangents: Vector3[] = [];
        const intermediates: Vector3[][][] = [];
        const basisFunctions: number[][] = [];

        const [leftBound, rightBound] = knotVector.support(degree);
        const step = roundN((rightBound - leftBound) / resolution);

        for (let u = leftBound; u < rightBound; u += step) {
            const [_point, _tangent, _intermediates, _coefficients] = this.evaluatePosition(knotVector, controlPoints, degree, u);
            curve.push(_point);
            tangents.push(_tangent);
            basisFunctions.push(_coefficients);
            intermediates.push(_intermediates);
        }

        return [curve, tangents, basisFunctions];
    }

    /**
     * The `evaluatePosition` function computes a point
     * @param knotVector the current state of knotes
     * @param controlPoints control points for the curve
     * @param degree the expected degree of polynomial segments
     * @param insertKnot requested position regarding the knot vector
     * @returns 
     */
    public static evaluatePosition(knotVector: KnotVector, controlPoints: Vector3[],
        degree: number, insertKnot: number): [Vector3, Vector3, Vector3[][], number[]] {
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

        // // @NICK
        // // these pascal row of degree -1 is effectively used to split the alphas and (1 - alphas) from each other
        // // when calculating which paths factor belong to which d
        // let pascalIdx = degree - r - 1;
        // let pascal = pascalRow(pascalIdx);
        // const alphas: number[] = [];
        // // fill intermediate alpha values with 1 as the neutral element for multiplikation
        // pascal.forEach(value => {
        //     for (let i = 0; i < value; i++) {
        //         alphas.push(1);
        //         alphas.push(1);
        //     }
        // });

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

            // // @NICK
            // let alphaIdx = 0;
            // pascal = pascalRow(pascalIdx--);
            for (let j = 0; j <= degree - r - k; j++) {
                // I - n + k + j, I + 1
                const uMin = knotVector.at(I - degree + k + j);
                const uMax = knotVector.at(I + 1 + j);
                const alpha = (insertKnot - uMin) / (uMax - uMin);

                interm[k].push(lerp(interm[k - 1][j], interm[k - 1][j + 1], alpha));

                // // @NICK
                // for (let idx = 0; idx < pascal[j]; idx++) {
                //     for (let jdx = 0; jdx < 2 ** (k - 1); jdx++) {
                //         alphas[alphaIdx++] *= (1 - alpha);
                //     }
                //     for (let jdx = 0; jdx < 2 ** (k - 1); jdx++) {
                //         alphas[alphaIdx++] *= alpha;
                //     }
                // }
            }
        }

        // @NICK remove to use yours
        const coefficients: number[] = [];
        controlPoints.forEach((_, idx) => {
            coefficients.push(this.N(knotVector, degree + 1, idx, insertKnot));
        });

        // // @NICK
        // //                                        1                                         n=0, k=n-1
        // //                   !a0                                     a0                     n=1, k=n-1 [a0]
        // //         !b0                  b0                 !b1                  b1          n=2, k=n-1 [b0, b1]
        // //    !c0       c0        !c1        c1       !c1       c1        !c2       c2      n=3, k=n-1 [c0, c1, c2]
        // // !d0   d0  !d1   d1  !d1   d1  !d1   d1  !d2   d2  !d2   d2  !d2   d2  !d3   d3   n=4, k=n-1 [d0, d1, d2, d3]
        // const summedAlphas: number[] = [];
        // if (alphas.length == 0) {
        //     // in case r = degree all previous loops are degenerated and a 1 needs to be placed manually
        //     summedAlphas.push(1);
        // } else {
        //     // sum up all conditional paths for a certain d
        //     let alphaIndex = 0;
        //     pascalRow(degree - r).forEach(value => {
        //         let sum = 0;
        //         for (let idx = 0; idx < value; idx++) {
        //             sum += alphas[alphaIndex++];
        //         }
        //         summedAlphas.push(sum);
        //     });
        // }

        // const coefficients = [];
        // // fill all N values before the left most used d with 0
        // for (let idx = 0; idx < leftBound; idx++) {
        //     coefficients.push(0);
        // }
        // // write all calculated alphas into the resulting coefficient vector
        // summedAlphas.forEach(value => {
        //     coefficients.push(value);
        // });
        // // fill all remaining N values with 0
        // for (let idx = leftBound + summedAlphas.length; idx < controlPoints.length; idx++) {
        //     coefficients.push(0);
        // }

        const point = interm.pop()?.at(0);
        if (point === undefined) throw new Error("Point does not exists.");

        const iteration = interm.pop();
        const tangent = (iteration === undefined) ? new Vector3() :
            iteration[1].clone().sub(iteration[0]).multiplyScalar(degree);
        if (iteration !== undefined) interm.push(iteration);

        return [point, tangent, interm, coefficients];

    }

    public static N(U: KnotVector, n: number, j: number, u: number): number {
        // This part is super weird. To be able to consider the functions
        // at the boundary of the U vector, we must evaluate the the given
        // position and check if it is NaN. We purposely introduced the NaN
        // values to disregard the left or right side of the recursion by
        // setting the factor to zero.
        const ujm1 = U.at(j - 1);
        const ujnm2 = U.at(j + n - 2);
        let leftFactor = (u - ujm1) / (ujnm2 - ujm1);
        if (!isFinite(leftFactor)) leftFactor = 0;

        const uj = U.at(j);
        const ujnm1 = U.at(j + n - 1);
        let rightFactor = (ujnm1 - u) / (ujnm1 - uj);
        if (!isFinite(rightFactor)) rightFactor = 0;

        // termination case
        if (n === 1) return (ujm1 <= u && u < uj) ? 1 : 0;

        let result = leftFactor * this.N(U, n - 1, j, u) +
            rightFactor * this.N(U, n - 1, j + 1, u);
        return result;
    }
}
