import { binomial, roundN } from "../base/utils";
import { KnotVector } from "../spline/knotVector";

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
            const t = roundN(idx / resolution);
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

    public static generateSplineBasis(degree: number, resolution: number,
        knotVector: KnotVector, controlPointsCount: number, complete: boolean = true): number[][] {

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

        this.cache.clear();
        const m = degree + 1;
        const coefficients: number[][] = [];
        for (let i = 0; i <= controlPointsCount; i++) {
            coefficients.push([]);
            for (const u of insertionKnots) {
                coefficients[i].push(this.N(knotVector, m, i, u));
            }
        }

        return coefficients;
    }

    private static cache = new Map<string, number>();
    private static N(U: KnotVector, n: number, j: number, u: number): number {

        // Check if the result is already in the cache.
        const key = `${n}${j}${u}`;
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            if (cached === undefined) throw new Error("Should not happen.");
            return cached;
        }

        const ujm1 = U.at(j - 1);
        const uj = U.at(j);

        // Termination case has to check if j - 1 was out of bounds.
        if (n === 1) return (isFinite(ujm1) && ujm1 <= u && u < uj) ? 1 : 0;

        const ujnm2 = U.at(j + n - 2);
        const ujnm1 = U.at(j + n - 1);

        let leftFactor = (u - ujm1) / (ujnm2 - ujm1);
        let rightFactor = (ujnm1 - u) / (ujnm1 - uj);

        // If any value was out of bound than there are nans => this side
        // cannot be evaluated.
        if (!isFinite(leftFactor)) leftFactor = 0;
        if (!isFinite(rightFactor)) rightFactor = 0;

        let result = leftFactor * this.N(U, n - 1, j, u) +
            rightFactor * this.N(U, n - 1, j + 1, u);

        // Store the result in the cache.
        this.cache.set(key, result);

        return result;
    }
}