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

    public static generateNormalisedBasis(knotVector: KnotVector, maxDegree: number, resolution: number,
        complete: boolean = true): number[][] {

        // determine the range for the u values
        const [min, max] = complete ? [knotVector.at(0), knotVector.at(knotVector.size - 1)] : knotVector.support(maxDegree);

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
        for (let degree = 1; degree <= maxDegree; degree++) {
            basis.push([]);
            for (let segment = 0; segment <= knotVector.size - 1 - degree; segment++) {
                basis[degree].push([]);
                for (let u = 0; u <= resolution; u++) {
                    basis[degree][segment].push(
                        this.calculateNValue(knotVector, degree - 1, segment, insertionKnots[u],
                            basis[degree - 1][segment][u], basis[degree - 1][segment + 1][u])
                    );
                }
            }
        }

        // STEP 3: only return last iteration as this contains the basis
        return basis[basis.length - 1];
    }

    public static calculateNValue(knots: KnotVector, degree: number, index: number,
        u: number, prevN1: number, prevN2: number): number {
        // pre calculate u values from indices
        const ui = knots.at(index);
        const uiDeg1 = knots.at(index + degree + 1);

        // CASE 1: u lies outside the support range -> return 0
        if (ui === undefined || uiDeg1 === undefined || u < ui || u >= uiDeg1) return 0;
        // CASE 2: degree is 0 -> constant line of 1
        if (degree == 0) return 1;

        const uiDeg = knots.at(index + degree);
        const ui1 = knots.at(index + 1);

        if (uiDeg === undefined || ui1 === undefined)
            throw new Error("Should not be undefined.");

        // CASE 3: calculate from alpha and previous N values
        let fac1 = (u - ui) / (uiDeg - ui);
        let fac2 = (uiDeg1 - u) / (uiDeg1 - ui1);
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