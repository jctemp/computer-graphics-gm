import { Vector3 } from "three";
import { lerp, roundN, transpose } from "../core/utils";
import { KnotVector } from "./knotVector";

export class SplineLogic {
    public static generateCurve(knotVector: KnotVector, controlPoints: Vector3[],
        degree: number, resolution: number, linearInterpolate: boolean = false): [Vector3[], Vector3[], Vector3[][][], number[][]] {
            let curve, tangents, intermediates, basisFunctions;
            if (linearInterpolate) {
                // calculate the curve using de boor's linear interpolation algorithm
                [curve, tangents, intermediates, basisFunctions] = LinearInterpolation.generateCurve(knotVector, controlPoints, degree, resolution);
            } else {
                // first calculate bases using cox de boor and using that the curve
                [curve, tangents, intermediates, basisFunctions] = CoxDeBoor.generateCurve(knotVector, controlPoints, degree, resolution);
            }
            return [curve, tangents, intermediates, basisFunctions];
    }
}

export class CoxDeBoor {
    public static generateCurve(knots: KnotVector, controlPoints: Vector3[],
        degree: number, resolution: number): [Vector3[], Vector3[], Vector3[][][], number[][]] {
        // define all output attributes
        const curve: Vector3[] = [];
        let tangents: Vector3[] = [];
        const intermediates: Vector3[][][] = [];
        let basisFunctions: number[][] = [];

        // pre initialize an array holding all u values to insert, because the lookup tables needs an index
        // to identify the saved values
        const [leftBound, rightBound] = knots.support(degree);
        const step = roundN((rightBound - leftBound) / resolution);
        const us: number[] = []
        for (let u = leftBound; u < rightBound; u += step) {
            us.push(u);
        }

        // create table for dynamic programming. if lets say one changes it to a map(number->number)[][] one
        // could get rid of the neccassity for udx inside the basis calculation
        const table = new Array(degree + 1).fill(0).map(() => 
            new Array(controlPoints.length + degree).fill(0).map(() => 
            new Array(us.length).fill(undefined)));

        // for each control point
        for (let idx = 0; idx < controlPoints.length; idx++) {
            basisFunctions.push([]);
            // for each knot value (u)
            us.forEach((u, udx) => basisFunctions[idx].push(this.basis(knots, degree, idx, u, udx, table)));
        }
        // transpose the bases to have u values as highest idx
        basisFunctions = transpose(basisFunctions);

        // calculate the curve and "intermediates" used. the intermediates are simple vectors
        // which are added together
        basisFunctions.forEach((value, jdx) => {
            let point = new Vector3(0, 0, 0);
            intermediates.push([]);
            value.forEach((factor, idx) => {
                if (factor != 0) {
                    const inter = controlPoints[idx].clone().multiplyScalar(factor);
                    intermediates[jdx].push([]);
                    intermediates[jdx][0].push(inter);
                    point.add(inter);
                }
            });
            curve.push(point);
        });

        // TODO calculate these ourselves
        const result = LinearInterpolation.generateCurve(knots, controlPoints, degree, resolution);
        tangents = result[1];
        // for each u value to insert
        this.derive(knots, controlPoints, degree, us, table)
        

        // return all calculated values
        return [curve, tangents, intermediates, basisFunctions];
    }

    /**
     * calculate the base functions in a dynamic recursive way, meaning one has to give it the parameter table
     * in which the intermediate values are stored. traces the points value back to degree 0 and all knots that
     * could influence it. the parameter can be kind of hard to understand because the e.g we are using the
     * curve's degree, not it's order.
     * 
     * @param knots knot vector
     * @param n degree
     * @param j index of control point
     * @param u u value to evaulate
     * @param udx index of u when sorting all values in an array
     * @param table [degree][j][udx]
     * @returns factor of the current control point at this position inside the intervall [0,1]
     */
    public static basis(knots: KnotVector, n: number, j: number, u: number, udx: number, table: number[][][]): number {
        // dynamic programming case. if the value was already calculated don't do it again.
        // the start up knot sequence calls this about 550 times so it's worth
        if (table[n][j][udx] !== undefined) return table[n][j][udx];

        // pre calculate the values which are guaranteed needed
        const knotValue_jminus1 = knots.at(j - 1);
        const knotValue_j = knots.at(j);

        // in case of degree 0 stop the recursion and look up, whether u lies inside the segment
        if (n === 0) return table[n][j][udx] = (u >= knotValue_jminus1 && u < knotValue_j) ? 1 : 0;

        // pre calculate remaining knots of certain indices
        const knotValue_jplusn = knots.at(j + n);
        const knotValue_jplusnminus1 = knots.at(j + n - 1);

        // left side basis
        let left = (u - knotValue_jminus1) / (knotValue_jplusnminus1 - knotValue_jminus1);
        if (!isFinite(left)) left = 0;
        const base1 = left * this.basis(knots, n - 1, j, u, udx, table);

        // right side basis
        let right = (knotValue_jplusn - u) / (knotValue_jplusn - knotValue_j);
        if (!isFinite(right)) right = 0;
        const base2 = right * this.basis(knots, n - 1, j + 1, u, udx, table);

        // write the new value into the lookup table and return it
        return table[n][j][udx] = base1 + base2;
    }

    // TODO         VL8 page 59
    public static derive(knots: KnotVector, controlPoints: Vector3[], n: number, us: number[], table: number[][][]): Vector3[] {
        const derivatives: Vector3[] = [];

        for (let udx = 0; udx < us.length; udx++) {
            let interm: Vector3 = new Vector3(0, 0, 0);
            // for each control point
            for (let j = 0; j < controlPoints.length - 1; j++) {
                // left side
                const left = n / (knots.at(j + n - 1) - knots.at(j - 1));
                let base1 = left * table[n - 1][j][udx];
                if (!isFinite(base1)) base1 = 0;
        
                // right side
                const right = n / (knots.at(j + n) - knots.at(j));
                let base2 = right * table[n - 1][j + 1][udx];
                if (!isFinite(base2)) base2 = 0;

                // divide them from each other
                const factor = base1 - base2;
            }
            derivatives.push(interm);
        }
        
        return derivatives;
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
    public static generateCurve(knotVector: KnotVector, controlPoints: Vector3[],
        degree: number, resolution: number): [Vector3[], Vector3[], Vector3[][][], number[][]] {

        // 1. calculate the curve points
        const curve: Vector3[] = [];
        const tangents: Vector3[] = [];
        const intermediates: Vector3[][][] = [];
        const basisFunctions: number[][] = [];

        const [leftBound, rightBound] = knotVector.support(degree);
        const step = roundN((rightBound - leftBound) / resolution);

        for (let u = leftBound; u < rightBound; u += step) {
            const position = this.evaluatePosition(knotVector, controlPoints, degree, u);
            curve.push(position[0]);
            tangents.push(position[1]);
            intermediates.push(position[2]);
            basisFunctions.push(position[3]);
        }

        return [curve, tangents, intermediates, basisFunctions];
    }

    /**
     * The `evaluatePosition` function computes a point
     * @param knotVector the current state of knotes
     * @param controlPoints control points for the curve
     * @param degree the expected degree of polynomial segments
     * @param u requested position regarding the knot vector
     * @returns a tuple of [point, tangent, interm, bases]
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

        // store the alpha values for later evaluation in an array of row and index like the intermediates.
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
        for (let k = 1; k <= degree - r; k++) {
            interm.push([]);
            alphas.push([]);
            for (let j = 0; j <= degree - r - k; j++) {
                // calculate alpha by finding out the ratio between u and the knots.
                const uMin = knotVector.at(I - degree + k + j);
                const uMax = knotVector.at(I + 1 + j);
                const alpha = (u - uMin) / (uMax - uMin);

                // save alpha AND 1 - alpha to simplify later indexing and calculation.
                alphas[k - 1].push(1 - alpha);
                alphas[k - 1].push(alpha);

                // the intermediate point is the result of lerping with the previous intermediates
                // and the current alpha. this is essentially the addition of one point multiplied
                // by 1 - alpha and the second point multiplied by alpha.
                //      PointC = (1 - alpha) * PointA + alpha * PointB
                interm[k].push(lerp(interm[k - 1][j], interm[k - 1][j + 1], alpha));
            }
        }

        // calculate base functions with the already saved alpha values
        // what happens here is kind of hard to imagine without graphical support but in general:
        //      every alpha value has a value of 1 - alpha -> that is why in alphas idx * 2
        //      for each row of the intermediate points in reverse order 
        //          the influence of the current point is calculated back to the original control points
        //      each point is dependent on two paths' which it influences -> that is why it is value += ...
        // this does indeed work but could probably be directly integrated in the above loop
        // after that the influence values are filled to the right point in the array over all control point
        // influences which will almost all be 0 (which is why the array gets filled with zeros to begin with).
        const coefficients = new Array(degree + 1 - r).fill(1).map((_value, idx) => new Array(degree + 1 - r - idx).fill(1));
        for (let row = degree - r - 1; row >= 0; row--) {
            coefficients[row].forEach((_value, idx) => {
                let value = 0;
                if (idx != 0) value = alphas[row][(idx * 2) - 1] * coefficients[row + 1][idx - 1];
                if (idx != coefficients[row].length - 1) value += alphas[row][idx * 2] * coefficients[row + 1][idx];
                coefficients[row][idx] = value;
            });
        }
        const bases = new Array(controlPoints.length).fill(0);
        for (let idx = 0; idx < degree + 1 - r; idx++) bases[leftBound + idx] = coefficients[0][idx];

        // split the point on the curve from the intermediates. this will throw an index error if it does not exist for
        // some reason -> TODO the undefined check doesn't work because "jest" did not accept the Array .at() method as
        // existant for some reason.
        const point = interm.pop()![0];
        if (point === undefined) throw new Error("Point does not exists.");

        // calculate tangent value. note that the last iteration is checked for existence in case r = degree.
        const iteration = interm.pop();
        const tangent = (iteration === undefined) ? new Vector3() :
            iteration[1].clone().sub(iteration[0]).multiplyScalar(degree);
        if (iteration !== undefined) interm.push(iteration);

        // return all calculated values.
        return [point, tangent, interm, bases];
    }
}
