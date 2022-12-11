export class SplineLogic {

    /**
     * sums up all multiplicities in the knot sequence and returns K (K-1 -> depends ....)
     * 
     * @param knots
     * @returns number of knots in sequence
     */
    public static getKnotLength(knots: Array<[number, number]>): number {
        let K = 0;
        knots.forEach((value) => {
            K += value[1];
        });
        return K;
    }

    /**
     * given an index in standard array form, this function calculates the corresponding u value in the
     * shortened knot sequence
     * 
     * @param knots 
     * @param idx 
     * @returns u value at index
     */
    public static translateIndex(knots: Array<[number, number]>, idx: number): number {
        let count = -1;
        let u = 0;
        knots.every((value) => {
            count += value[1];
            if (count >= idx) {
                u = value[0];
                return false;
            }
            return true;
        });
        return u;
    }

    /**
     * generate the abscissae values from the knot sequence
     * 
     * @param knots 
     * @param degree 
     * @returns list of abscissae values
     */
    public static generateAbscissae(knots: Array<[number, number]>, degree: number): Array<number> {
        let results = new Array<number>();
        for (let idx = 0; idx <= this.getKnotLength(knots) - degree; idx++) {
            let abscissa = 0;
            for (let jdx = 0; jdx < degree; jdx++) {
                abscissa += this.translateIndex(knots, idx + jdx);
            }
            abscissa /= degree;
            results.push(abscissa);
        }
        return results;
    }





    /**
     * for the given knot sequence, calculate the value of N function of degree and index
     * for a specific u. Needs an array of previous values -> an empty array for calculating
     * degree 0
     * 
     * @param knots 
     * @param degree [degree n] or for that matter [order m - 1]
     * @param index j
     * @param u index for the values array
     * @param values u values pre calculated in an array
     * @param prev 
     * @returns the calculated value as number
     */
    public static calculateNValue(
        knots: Array<[number, number]>, 
        degree: number,
        index: number,
        u_value: number,
        prevN1: number,
        prevN2: number): number {
            // pre calculate
            const uOfI = this.translateIndex(knots, index);
            const uOfIPlus1 = this.translateIndex(knots, index + 1);
            // CASE 1: degree is 0 -> different calculation
            if (degree == 0) {
                if (u_value < uOfIPlus1 && u_value >= uOfI) {
                        return 1;
                }
                return 0;
            }

            // pre calculate 
            const uOfIplusDegreePlus1 = this.translateIndex(knots, index + degree + 1); 
            // CASE 2: u lies outside it's support -> return 0
            if (u_value < uOfI || u_value >= uOfIplusDegreePlus1) return 0;
            
            // CASE 3: else calculate factors from previous N
            // pre calculate
            const uOfIplusDegree = this.translateIndex(knots, index + degree);
            // calculate alpha values
            let fac1 = (u_value - uOfI) / (uOfIplusDegree - uOfI);
            let fac2 = (uOfIplusDegreePlus1 - u_value) / (uOfIplusDegreePlus1 - uOfIPlus1);
            // prevent e.g. dividing by 0 (which happens)
            if(!isFinite(fac1)) fac1 = 0;
            if(!isFinite(fac2)) fac2 = 0;
            // return sum of previous N (with factor alpha)
            return fac1 * prevN1 + fac2 * prevN2;
    }

    /**
     * calculate all base functions for the knot sequence up to the given degree
     * 
     * @param knots 
     * @param degree 
     * @param resolution 
     * @returns all base function values in an array of [m][j][u]
     */
    public static generateBaseFunctions(
        knots: Array<[number, number]>, 
        degree: number,
        resolution: number): Array<Array<Array<number>>>{
            // array of return values
            const bases = Array<Array<Array<number>>>();
            
            // get value of least knot
            let min = knots[0][0];
            //get value of highest knot
            let max = knots[knots.length - 1][0];
            //calculate step size
            let step = (max - min) / resolution;

            // pre calculate u values to prevent rounding errors
            let values = new Array<number>();
            for (let h = 0; h <= resolution; h++) {
                let k = min + h * step;
                k = Math.round(k * 10000) / 10000;
                values.push(k);
            }

            // handle fencepost n = 0, because previous values do not exist
            bases.push(Array<Array<number>>());
            for (let idx = 0; idx <= this.getKnotLength(knots) - 1; idx++) {
                bases[0].push(Array<number>());
                // for each index
                for (let u = 0; u <= resolution; u++) {
                    let value = this.calculateNValue(knots, 0, idx, values[u], 0, 0);
                    bases[0][idx].push(value);
                }
            }

            // for each degree
            for (let n = 1; n <= degree; n++) {
                bases.push(Array<Array<number>>())
                // for each segment
                for (let idx = 0; idx <= this.getKnotLength(knots) - n - 1; idx++) {
                    bases[n].push(Array<number>());
                    // for each index
                    for (let u = 0; u <= resolution; u++) {
                        let value = this.calculateNValue(knots, n - 1, idx, values[u], bases[n-1][idx][u], bases[n-1][idx+1][u]);
                        bases[n][idx].push(value);
                    }
                }
            }
            // return all calculated functions
            return bases;     
    }
}
