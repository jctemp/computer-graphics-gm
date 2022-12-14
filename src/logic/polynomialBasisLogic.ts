import { binomial } from "../core/utils";

export class PolynomialBasisLogic {
    /**
     * Calculates the Bernstein polynomial function of a basis degree n
     */
    public static generateBasis(degree: number, resolution: number): number[][] {
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
}