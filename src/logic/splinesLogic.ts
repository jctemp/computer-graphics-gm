import { Vector3 } from "three";
import { lerp, roundN } from "../core/utils";
import { KnotVector } from "./knotVector";

export class SplineLogic {
    public static generateCurve(knotVector: KnotVector, controlPoints: Vector3[],
        degree: number, resolution: number, linearInterpolate: boolean = true): [Vector3[], Vector3[], number[][]] {
            let curve, tangents, basisFunctions;
            if (linearInterpolate) {
                // currently the reference for linear interpolation
                [curve, tangents, basisFunctions] = LinearInterpolation.generateReference(knotVector, controlPoints, degree, resolution);
            } else {
                [curve, tangents, basisFunctions] = CoxDeBoor.generateExperiment(knotVector, controlPoints, degree, resolution);
            }
            return [curve, tangents, basisFunctions];
    }
}

export class CoxDeBoor {
    public static generateExperiment(knots: KnotVector, controlPoints: Vector3[],
        degree: number, resolution: number): [Vector3[], Vector3[], number[][]] {

        // 1. calculate the curve points
        const curve: Vector3[] = [];
        const tangents: Vector3[] = [];
        const intermediates: Vector3[][][] = [];
        const basisFunctions: number[][] = [];

        const [leftBound, rightBound] = knots.support(degree);
        const step = roundN((rightBound - leftBound) / resolution);

        for (let u = leftBound; u < rightBound; u += step) {
            const [I, r] = knots.indexOf(u);

            const interm: Vector3[][] = [[]];
            const leftBound = I - degree + 1;
            for (let i = leftBound; i <= I + 1 - r; i++) {
                interm[0].push(controlPoints[i].clone());
            }

            for (let k = 1, p = degree - r - 1; k <= degree - r; k++, p--) {
                interm.push([]);
                for (let j = 0; j <= degree - r - k; j++) {
                    const uMin = knots.at(I - degree + k + j);
                    const uMax = knots.at(I + 1 + j);
                    const alpha = (u - uMin) / (uMax - uMin);
    
                    interm[k].push(lerp(interm[k - 1][j], interm[k - 1][j + 1], alpha));
                }
            }
    
            const coefficients: number[] = [];
            controlPoints.forEach((_, idx) => {
                coefficients.push(this.N(knots, degree + 1, idx, u));
            });
    
            const point = interm.pop()![0];
            if (point === undefined) throw new Error("Point does not exists.");
    
            const iteration = interm.pop();
            const tangent = (iteration === undefined) ? new Vector3() :
                iteration[1].clone().sub(iteration[0]).multiplyScalar(degree);
            if (iteration !== undefined) interm.push(iteration);
    
            curve.push(point);
            tangents.push(tangent);
            intermediates.push(interm);
            basisFunctions.push(coefficients);
        }

        return [curve, tangents, basisFunctions];
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

export class LinearInterpolation {
    /**
     * The `generateCurve` function computes `1 / resolution` points on a the bspline.
     * @param knotVector contains a list of u's
     * @param controlPoints  initial values for the curve.
     * @param degree of the polynomial segments
     * @param resolution sampling count for the curve.
     * @returns a tuple in the from of `[points, intermediates]`
     */
    public static generateReference(knotVector: KnotVector, controlPoints: Vector3[],
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
     * @param u requested position regarding the knot vector
     * @returns 
     */
    public static evaluatePosition(knotVector: KnotVector, controlPoints: Vector3[],
        degree: number, u: number): [Vector3, Vector3, Vector3[][], number[]] {
        // The first step is to determine the insertPosition of the current knot, which
        // is u ∈ [u_I, u_{I + 1}) where u is the `insertKnot`. 
        // In addition, we can retrieve the multiplicity `r` of the `insertKnot`.
        const [I, r] = knotVector.indexOf(u);

        // `intermediates` will contail the iterations of the de-boor algorithm. At this
        // stage we only want the inital points required at the r-th column of the triangle.
        // This also solve the fence post problem.
        const interm: Vector3[][] = [[]];
        const leftBound = I - degree + 1;
        for (let i = leftBound; i <= I + 1 - r; i++) {
            interm[0].push(controlPoints[i].clone());
        }

        // store the alpha values for later evaluation

        const alphas: number[][] = [];

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
        for (let k = 1; k <= degree - r; k++) {
            interm.push([]);
            alphas.push([]);
            for (let j = 0; j <= degree - r - k; j++) {
                const uMin = knotVector.at(I - degree + k + j);
                const uMax = knotVector.at(I + 1 + j);
                const alpha = (u - uMin) / (uMax - uMin);

                alphas[k - 1].push(1 - alpha);
                alphas[k - 1].push(alpha);

                interm[k].push(lerp(interm[k - 1][j], interm[k - 1][j + 1], alpha));
            }
        }

        // calculate base functions
        const coefficients = new Array(degree + 1 - r).fill(1).map((_value, idx) => new Array(degree + 1 - r - idx).fill(1));
        for (let row = degree - r - 1; row >= 0; row--) {
            coefficients[row].forEach((_value, idx) => {
                let value = 0;
                if (idx != 0) value = alphas[row][(idx * 2) - 1] * coefficients[row + 1][idx - 1];
                if (idx != coefficients[row].length - 1) value += alphas[row][idx * 2] * coefficients[row + 1][idx];
                coefficients[row][idx] = value;
            });
        }
        const coefficientList = new Array(controlPoints.length).fill(0);
        for (let idx = 0; idx < degree + 1 - r; idx++) coefficientList[leftBound + idx] = coefficients[0][idx];

        // point on the curve
        const point = interm.pop()![0];
        if (point === undefined) throw new Error("Point does not exists.");

        // calculate tangent
        const iteration = interm.pop();
        const tangent = (iteration === undefined) ? new Vector3() :
            iteration[1].clone().sub(iteration[0]).multiplyScalar(degree);
        if (iteration !== undefined) interm.push(iteration);

        return [point, tangent, interm, coefficientList];

    }
}
