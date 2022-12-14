import { Vector3 } from "three";
import { lerp, roundN } from "../core/utils";

/**
 * The `KnotVector` class is an abstraction to handle the knots
 * via [knot, multiplicity] and making the operations on the list
 * easier.
 */
export class KnotVector {
    knots: Map<number, number>;
    constructor(knot_vector: number[]) {
        this.knots = new Map<number, number>;
        knot_vector.forEach(element => this.insert(element));
    }

    /**
     * Finds to a given index the knot value
     * @param idx of the knot in the vector
     * @returns the knot value
     */
    public findKnot(idx: number): number {
        let count = -1;
        for (const key of this.knots.keys()) {
            let multiplicity = this.knots.get(key);
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
        for (const key of this.knots.keys()) {
            if (key < knot) {
                let tmp = this.knots.get(key);
                if (tmp === undefined) throw new Error("Impossible");
                index += tmp;
            } else if (key === knot) {
                let tmp = this.knots.get(key);
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
        const value = this.knots.get(knot);
        if (value === undefined) {
            this.knots.set(knot, 1);
        } else {
            this.knots.set(knot, value + 1);
        }
        this.knots = new Map([...this.knots.entries()].sort((a, b) => a[0] - b[0]));
    }

    /**
     * Sums all multiplicities of the knot sequence which corresponds to the number of knots
     * @returns number of knots in the sequence.
     */
    public size(): number {
        let summation = 0;
        for (let value of this.knots.values()) {
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
        degree: number, resolution: number): Vector3[] {

        const curve: Vector3[] = [];
        const [leftBound, rightBound] = knotVector.support(degree);
        const step = roundN((rightBound - leftBound) / resolution);

        for (let u = leftBound; u < rightBound; u += step) {
            const [point, _] = this.evaluatePosition(knotVector, controlPoints, degree, u);
            curve.push(point);
        }

        return curve;
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
        degree: number, insertKnot: number): [Vector3, Vector3[][]] {

        // The first step is to determine the insertPosition of the current knot, which
        // is u ∈ [u_I, u_{I + 1}) where u is the `insertKnot`. 
        // In addition, we can retrieve the multiplicity `r` of the `insertKnot`.
        const [I, r] = knotVector.findIndex(insertKnot);

        // Find the control points and the intermediates for a given `insertKnot`. The
        // activeControlPoints contains all iterations of the de-boor algorithm. With
        // that, the k defines `iteration` as seen later.
        const iterations: Vector3[][] = [];
        for (let k = 0; k <= r; k++) {
            iterations.push([]);
            for (let j = r; j <= degree; j++) {
                iterations[k].push(controlPoints[I - degree + j + 1].clone());
            }
        }

        // see algorithm 8.1 -> directly written from it
        for (let k = r + 1; k <= degree; k++) {
            iterations.push([]);
            for (let j = 0; j <= degree - k; j++) {
                const minKnot = knotVector.findKnot(I - degree + k + j);
                const maxKnot = knotVector.findKnot(I + 1 + j);
                const denominator = maxKnot - minKnot;

                if (denominator === 0) throw new Error("Check required");
                const alpha = (insertKnot - minKnot) / denominator;

                // The used points in the lerp represent the controlPoints at a specific 
                // iteration. Here the k - 1 is the previous iteration and j as j + 1 
                // the active control points at an iteration.
                iterations[k].push(lerp(iterations[k - 1][j], iterations[k - 1][j + 1], alpha));
            }
        }

        const point = iterations.pop()?.at(0);
        if (point === undefined) throw new Error("Evaluate position: no point calculated.");

        return [point, iterations];
    }
}
