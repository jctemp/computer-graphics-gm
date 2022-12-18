import { binomial, roundN } from "../core/utils";
import { KnotVector } from "./splinesLogic";

export class PolynomialBasisLogic {
    /**
     * Calculates the Bernstein polynomial function of a basis degree n
     */
    public static generateBernsteinBasis(degree: number, resolution: number): number[][] {
        const baseFunctions: number[][] = [];
        for (let idx = 0; idx < degree + 1; idx++) {
            baseFunctions.push([])
        }

        for (let idx = 0; idx <= resolution; idx++) {
            const t = idx / resolution;
            const coefficients = PolynomialBasisLogic.calculateCoefficients(degree, t);
            for (let jdx = 0; jdx < degree + 1; jdx++) {
                baseFunctions[jdx].push(coefficients[jdx]);
            }
        }
        return baseFunctions;
    }

    public static generateNormalisedBasis(knotVector: KnotVector, degree: number, resolution: number): number[][][] {
        const bases: number[][][] = [];
        const knotVectorIdxMax = knotVector.size() - 1;

        // u values
        let min = knotVector.findKnot(0);
        let max = knotVector.findKnot(knotVectorIdxMax);
        let step = (max - min) / resolution;
        let values: number[] = [];
        for (let h = 0; h <= resolution; h++) {
            values.push(roundN(min + h * step));
        }

        // handle fencepost n = 0, because previous values do not exist
        bases.push([]);
        for (let idx = 0; idx <= knotVectorIdxMax; idx++) {
            bases[0].push([]);
            // for each index
            for (let u = 0; u <= resolution; u++) {
                bases[0][idx].push(this.calculateNValue(knotVector, 0, idx, values[u], 0, 0));
            }
        }

        // for each degree
        for (let n = 1; n <= degree; n++) {
            bases.push([]);
            // for each segment
            for (let idx = 0; idx <= knotVectorIdxMax - n; idx++) {
                bases[n].push([]);
                // for each index
                for (let u = 0; u <= resolution; u++) {
                    bases[n][idx].push(
                        this.calculateNValue(knotVector, n - 1, idx, values[u],
                            bases[n - 1][idx][u], bases[n - 1][idx + 1][u])
                    );
                }
            }
        }

        return bases;
    }

    public static calculateNValue(
        knots: KnotVector,
        degree: number,
        index: number,
        u: number,
        prevN1: number,
        prevN2: number): number {
        // pre calculate u values from indices
        const ui = knots.findKnot(index);
        const ui1 = knots.findKnot(index + degree + 1);

        // CASE 1: u lies outside the support range -> return 0
        if (u < ui || u >= ui1) return 0;
        // degree is 0 -> constant line of 1
        if (degree == 0) return 1;

        // CASE 2: calculate from alpha and previous N values
        let fac1 = (u - ui) /
            (knots.findKnot(index + degree) - ui);
        let fac2 = (ui1 - u) /
            (ui1 - knots.findKnot(index + 1));
        // prevent e.g. dividing by 0 (which happens)
        if (!isFinite(fac1)) fac1 = 0;
        if (!isFinite(fac2)) fac2 = 0;
        // return sum of previous N (with factor alpha)
        return fac1 * prevN1 + fac2 * prevN2;
    }



    /**
     * Weight the contribution of controlpoints by calculating the values of the different terms of the
     * Bernstein polynome.
     * @param n The degree of the polynomial basis
     * @param t weight to determine a point (Note: assumed is a normalised value [0,1])
     * @returns the coefficient values of the the polynomials
     */
    private static calculateCoefficients(n: number, t: number): number[] {
        let coefficients: number[] = [];
        for (let j = 0; j <= n; j++) {
            coefficients.push(
                binomial(n, j) *       // n over k
                (t ** j) *             // t^j
                ((1 - t) ** (n - j))   // (1-t)^(n-j)
            );
        }

        return coefficients;
    }
}