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
        u: number,
        values: Array<number>,
        prev: Array<Array<number>>): number {
            // if curve degree is 0 -> different calculation (not recursive)
            if (degree == 0) {
                if (values[u] < this.translateIndex(knots, index + 1) && 
                    values[u] >= this.translateIndex(knots, index)) {
                        return 1;
                }
                return 0;
            }
            if (values[u] < this.translateIndex(knots, index) ||
                values[u] >= this.translateIndex(knots, index + degree + 1)) return 0;
            // calculate factors for previous N
            let fac1 =  (values[u] - this.translateIndex(knots, index)) / 
                        (this.translateIndex(knots, index + degree) - this.translateIndex(knots, index));
            let fac2 =  (this.translateIndex(knots, index + degree + 1) - values[u]) / 
                        (this.translateIndex(knots, index + degree + 1) - this.translateIndex(knots, index + 1));
            // prevent e.g. dividing by 0 (which happens)
            if(!isFinite(fac1)) fac1 = 0;
            if(!isFinite(fac2)) fac2 = 0;
            return fac1 * prev[index][u] + fac2 * prev[index+1][u];
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

            // empty placeholder for m = 0;
            // yes this is a placehodler for the first recursion step
            // while this wastes space it saves calculation time ...
            bases.push(Array<Array<number>>())

            // for each degree
            for (let m = 1; m < degree + 1; m++) {
                bases.push(Array<Array<number>>())
                // for each segment
                for (let idx = 0; idx <= this.getKnotLength(knots) - m - 1; idx++) {
                    bases[m].push(Array<number>());
                    // for each index
                    for (let u = 0; u <= resolution; u++) {
                        let value = this.calculateNValue(knots, m - 1, idx, u, values, bases[m - 1]);
                        bases[m][idx].push(value);
                    };
                }
            }
            // return all calculated functions
            return bases;     
    }
}
