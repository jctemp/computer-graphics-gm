import { Vector3 } from "three";
import { lerp, pascalRow, roundN } from "../core/utils";

/**
 * The `KnotVector` class is an abstraction to handle the knots
 * via [knot, multiplicity] and making the operations on the list
 * easier.
 */
export class KnotVector {
    _knots: Map<number, number>;
    _maxCount: number;
    constructor(knotVector: number[], maxKnotCount: number = Number.MAX_SAFE_INTEGER) {
        this._maxCount = maxKnotCount;
        this._knots = new Map<number, number>;
        knotVector.forEach(element => this.insert(element));
    }

    public set knots(_: string) {
        /* 
        THE GETTER AND SETTER IS THERE FOR THE GUI, WHICH IS MANDATORY.
        HERE IS NO IMPLEMENTATION AS IT SHOULD NOT BE USED, HENCE NO
        FUNCTIONALITY.
        */
    }

    public get knots(): string {
        return this.array.toString().replaceAll(",", " ");
    }

    public get array(): number[] {
        const list: number[] = [];
        for (const key of this._knots.keys()) {
            let multiplicity = this._knots.get(key);
            if (multiplicity) {
                for (let idx = 0; idx < multiplicity; idx++) {
                    list.push(key);
                }
            }
        }
        return list;
    }

    public clone(): KnotVector {
        return new KnotVector(this.array);
    }

    /**
     * Finds to a given index the knot value
     * @param idx of the knot in the vector
     * @returns the knot value
     */
    public findKnot(idx: number): number {
        let count = -1;
        for (const key of this._knots.keys()) {
            let multiplicity = this._knots.get(key);
            if (multiplicity) {
                count += multiplicity;
                if (count >= idx)
                    return key;
            }
        }
        return this.findKnot(this.size() - 1);
    }

    /**
     * Finds the highest index for a given knot value
     * @param knot 
     * @returns 
     */
    public findIndex(knot: number): [number, number] {
        let index = 0;
        let multiplicity = 0;
        for (const key of this._knots.keys()) {
            if (key < knot) {
                let tmp = this._knots.get(key);
                if (tmp === undefined) throw new Error("Impossible");
                index += tmp;
            } else if (key === knot) {
                let tmp = this._knots.get(key);
                if (tmp === undefined) throw new Error("Impossible");
                index += tmp;
                multiplicity = tmp;
            } else {
                break
            }
        }
        return [index - 1, multiplicity]
    }

    /**
     * Insert a knot at the correct position or updates the multiplicity.
     * @param knot a number
     */
    public insert(knot: number): void {
        if (this.size() === this._maxCount) return;

        const value = this._knots.get(knot);
        if (value === undefined) {
            this._knots.set(knot, 1);
        } else {
            this._knots.set(knot, value + 1);
        }
        this._knots = new Map([...this._knots.entries()].sort((a, b) => a[0] - b[0]));
    }

    /**
     * Delete a knot at the correct position or updates the multiplicity.
     * @param knot a number
     */
    public delete(knot: number): void {
        const multiplicity = this._knots.get(knot);
        if (multiplicity && multiplicity == 1) this._knots.delete(knot);
        else if (multiplicity) this._knots.set(knot, multiplicity - 1);
    }

    /**
     * Sums all multiplicities of the knot sequence which corresponds to the number of knots
     * @returns number of knots in the sequence.
     */
    public size(): number {
        let summation = 0;
        for (let value of this._knots.values()) {
            summation += value
        }
        return summation;
    }

    /**
     * The support describes the interval where a bspline of degree n
     * is defined.
     * @param degree of the segment polynomials
     * @returns the support of this knot vector for given degree in
     * the form `[leftBound, rightBound)`
     */
    public support(degree: number): [number, number] {
        const leftBound = this.findKnot(degree - 1);
        const rightBound = this.findKnot(this.size() - degree);
        return [leftBound, rightBound]
    }

    /**
     * Calculates the |D| = K - n + 1
     * @param degree of the target polynomial
     * @returns amount of required control points
     */
    public requiredControlPoints(degree: number): number {
        return this.size() - degree + 1;
    }
}

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
        const baseFunctions: number[][] = [];

        const [leftBound, rightBound] = knotVector.support(degree);
        const step = roundN((rightBound - leftBound) / resolution);

        for (let u = leftBound; u < rightBound; u += step) {
            const [point, _, baseFunctionsAtU] = this.evaluatePosition(knotVector, controlPoints, degree, u);
            curve.push(point);
            baseFunctions.push(baseFunctionsAtU);
        }

        // 2. calculate the tangents
        const tangents: Vector3[] = [];
        const degreeDerivates = degree - 1;

        // 2.1 determine the difference between control points
        const controlPointDeltas: Vector3[] = [];
        for (let idx = 0; idx < controlPoints.length - 1; idx++) {
            controlPointDeltas.push(controlPoints[idx + 1].clone().sub(controlPoints[idx]));
        }

        // 2.2 we reduced the amount of available control points, therefore we need to remove
        //     one knot from both ends to have the correct support. 
        //     See relationship `L = K - n + 1`.
        const knotVectorDeltas = knotVector.clone();
        knotVectorDeltas.delete(knotVectorDeltas.findKnot(0));
        knotVectorDeltas.delete(knotVectorDeltas.findKnot(knotVectorDeltas.size()));

        const [leftBoundDeltas, rightBoundDeltas] = knotVectorDeltas.support(degreeDerivates);
        const stepDeltas = roundN((rightBoundDeltas - leftBoundDeltas) / resolution);

        // 2.3 Now, we can simply evaluate the curve tangents, as we apply de-boor for a function
        //     of lower degree
        for (let u = leftBoundDeltas; u < rightBoundDeltas; u += stepDeltas) {
            let [tangent, _] = this.evaluatePosition(knotVectorDeltas, controlPointDeltas, degreeDerivates, u);
            tangent.multiplyScalar(degreeDerivates);
            tangents.push(tangent);
        }

        return [curve, tangents, baseFunctions];
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
        degree: number, insertKnot: number): [Vector3, Vector3[][], number[]] {

        // The first step is to determine the insertPosition of the current knot, which
        // is u ∈ [u_I, u_{I + 1}) where u is the `insertKnot`. 
        // In addition, we can retrieve the multiplicity `r` of the `insertKnot`.
        const [I, r] = knotVector.findIndex(insertKnot);

        // `intermediates` will contail the iterations of the de-boor algorithm. At this
        // stage we only want the inital points required at the r-th column of the triangle.
        const intermediates: Vector3[][] = [];
        intermediates.push([]);

        // pre calculate the left bound index of the control points (because it is needed for later use)
        const mostLeftDIndex = I - degree + 1;
        for (let j = mostLeftDIndex; j <= I - r + 1; j++) {
            intermediates[0].push(controlPoints[j].clone());
        }

        const pascal = pascalRow(degree - r - 1);
        const alphas: number[] = [];
        // fill intermediate alpha values with 1 as the neutral element for multiplikation
        pascal.forEach(value => {
            for (let i = 0; i < value; i++) {
                alphas.push(1);
                alphas.push(1);
            }
        });

        // The algorithm starts at the r-th column with n-k-r entries. That's why we need to
        // subtract `r` from `degree` as there are `degree` columns.
        for (let k = 1; k <= degree - r; k++) {
            intermediates.push([]);
            let alphaIndex = 0;
            for (let j = 0; j <= degree - k - r; j++) {
                // This is effectivly calculating alpha on multiple lines. As `findKnot` is
                // in O(n), we precalucalted the knots.
                const minKnot = knotVector.findKnot(I - degree + k + j);
                const maxKnot = knotVector.findKnot(I + 1 + j);
                const denominator = maxKnot - minKnot;

                const alpha = (insertKnot - minKnot) / denominator;

                // mulitply all paths in the alphas-vector that lead to this specific cpoint in calculation
                // by alpha or (1 - alpha). this must happen a specific amount of times consecutively and at
                // a certain interval length, at which the alpha has an impact. TODO explain better gl hf
                for (let idx = 0; idx < pascal[j]; idx++) {
                    for (let jdx = 0; jdx < 2 ** (k-1); jdx++) {
                        alphas[alphaIndex++] *= (1 - alpha);
                    }
                    for (let jdx = 0; jdx < 2 ** (k-1); jdx++) {
                        alphas[alphaIndex++] *= alpha;
                    }
                }

                // The used points in the lerp represent the controlPoints at a specific 
                // iteration. Here the k - 1 is the previous iteration and j as j + 1 
                // the active control points at an iteration.
                intermediates[k].push(lerp(intermediates[k - 1][j], intermediates[k - 1][j + 1], alpha));
            }
        }

        const summedAlphas: number[] = [];
        if (alphas.length == 0) {
            // in case r = degree all previous loops are degenerated and a 1 needs to be placed manually
            summedAlphas.push(1);
        } else {
            // sum up all conditional paths for a certain d
            let alphaIndex = 0;
            pascalRow(degree - r).forEach(value => {
                let sum = 0;
                for (let idx = 0; idx < value; idx++) {
                    sum += alphas[alphaIndex++];
                }
                summedAlphas.push(sum);
            });
        }

        const coefficients = [];
        // fill all N values before the left most used d with 0
        for (let idx = 0; idx < mostLeftDIndex; idx++) {
            coefficients.push(0);
        }
        // write all calculated alphas into the resulting coefficient vector
        summedAlphas.forEach(value => {
            coefficients.push(value);
        });
        // fill all remaining N values with 0
        for (let idx = mostLeftDIndex + summedAlphas.length; idx < controlPoints.length; idx++) {
            coefficients.push(0);
        }

        // split up the resulting point from the intermediate ones
        const point = intermediates.pop()?.at(0);
        if (point === undefined) throw new Error("Evaluate position: no point calculated.");

        return [point, intermediates, coefficients];
    }
}
