export class BasisGenerator {
    /**
     * Calculates the Bernstein polynomial function of a basis degree n
     */
    public static generateBasisFunctions(controlPointsCount: number, resolution: number): Array<Array<number>> {
        const baseFunctions = Array<Array<number>>();
        for (let idx = 0; idx < controlPointsCount; idx++) {
            baseFunctions.push(Array<number>())
        }

        for (let idx = 0; idx <= resolution; idx++) {
            const t = idx / resolution;
            const coefficients = BasisGenerator.calculateCoefficients(controlPointsCount - 1, t);
            for (let jdx = 0; jdx < controlPointsCount; jdx++) {
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
    public static calculateCoefficients(n: number, t: number): Array<number> {
        let coefficients = new Array<number>();
        for (let j = 0; j <= n; j++) {
            coefficients.push(
                BasisGenerator.binomial(n, j) * // n over k
                (t ** j) *                                // t^j
                ((1 - t) ** (n - j))                      // (1-t)^(n-j)
            );
        }
        return coefficients;
    }

    /**
     * Calculates the binomial coefficients.
     */
    private static binomial(n: number, k: number): number {
        let coefficient = 1;
        for (let x = n - k + 1; x <= n; x++) {
            coefficient *= x;
        }

        for (let x = 1; x <= k; x++) {
            coefficient /= x;
        }

        return coefficient;
    }

}