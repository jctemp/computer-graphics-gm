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
}
