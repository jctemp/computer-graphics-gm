import { binomial, roundN } from "../core/utils";
import { KnotVector } from "./knotVector";

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

    /**
     * Calculates the generic polynomial function of a basis degree n
     */
    public static generateNormalisedBasis(knotVector: KnotVector, degree: number, resolution: number,
        complete: boolean = true): number[][] {

        // determine the range for the u values
        const [min, max] = complete ? [knotVector.at(0), knotVector.at(knotVector.size - 1)] : knotVector.support(degree);

        // check invariance that the knotvector is not length 0
        if (max === undefined || min === undefined)
            throw new Error("KnotVector is empty");

        // evaluate all u's based on targeted resolution
        let step = (max - min) / resolution;
        let insertionKnots: number[] = [];
        for (let h = 0; h <= resolution; h++) {
            insertionKnots.push(roundN(min + h * step));
        }

        // START calculating the basis functions
        const basis: number[][][] = [];

        // STEP 1: evaluate constants
        basis.push([]);
        for (let idx = 0; idx < knotVector.size; idx++) {
            basis[0].push([]);
            // for each index
            for (let u = 0; u <= resolution; u++) {
                basis[0][idx].push(this.calculateNValue(knotVector, 0, idx, insertionKnots[u], 0, 0));
            }
        }

        // STEP 2: for all degrees greater zero, derive new basis from prvious
        for (let n = 1; n <= degree; n++) {
            basis.push([]);
            for (let k = 0; k <= knotVector.size - 1 - n; k++) {
                basis[n].push([]);
                for (let u = 0; u <= resolution; u++) {
                    basis[n][k].push(
                        this.calculateNValue(knotVector, n - 1, k, insertionKnots[u],
                            basis[n - 1][k][u], basis[n - 1][k + 1][u])
                    );
                }
            }
        }

        // STEP 3: only return last iteration as this contains the basis
        return basis[basis.length - 1];
    }

    /**
     * Calculate the N value of a knot u for a degree based on the index and previous values
     * @param knotVector contains all the knots available for a calculation
     * @param degree of the current polynomial function
     * @param index where the calculation happens
     * @param u is the inserted knot value
     * @param previousValue1 is the value from degree - 1 at the position k for the knot u
     * @param previousValue2 is the value from degree - 1 at the position k+1 for the knot u
     * @returns the value for degree, k for a knot u
     */
    private static calculateNValue(knotVector: KnotVector, degree: number, index: number,
        u: number, previousValue1: number, previousValue2: number): number {
        const ui = knotVector.at(index);
        const uiDeg1 = knotVector.at(index + degree + 1);

        // CASE 1: u lies outside the support range -> return 0
        if (ui === undefined || uiDeg1 === undefined || u < ui || u >= uiDeg1) return 0;

        // CASE 2: degree is 0 -> constant line of 1
        if (degree == 0) return 1;

        // CASE 3: calculate from alpha and previous N values
        const uiDeg = knotVector.at(index + degree);
        const ui1 = knotVector.at(index + 1);

        if (uiDeg === undefined || ui1 === undefined)
            throw new Error("Should not be undefined.");

        let fac1 = (u - ui) / (uiDeg - ui);
        let fac2 = (uiDeg1 - u) / (uiDeg1 - ui1);

        if (!isFinite(fac1)) fac1 = 0;
        if (!isFinite(fac2)) fac2 = 0;

        return fac1 * previousValue1 + fac2 * previousValue2;
    }
}