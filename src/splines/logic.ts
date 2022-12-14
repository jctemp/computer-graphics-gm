import { Vector3 } from "three";

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
     * calculate highest index of a u in the sequence that is not larger than the given value
     * 
     * @param knots 
     * @param u 
     * @returns index in knot sequence
     */
    public static findIndexForU(knots: Array<[number, number]>, u: number): number {
        let idx = 0;
        let result = -1;
        knots.every(value => {
            if (value[0] < u) {
                idx += value[1];
                return true;
            } else if (value[0] == u) {
                result = idx + value[1] - 1
            } else {
                result = idx--;
            }
            return false;
        });
        return result;
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
     * calculate (resolution + 1) knot values to insert over the knot interval [min, max]
     * 
     * @param knots 
     * @param resolution 
     * @returns 
     */
    public static generateUValues(
        knots: Array<[number, number]>, 
        resolution: number): Array<number> {
            // get value of least knot
            let min = knots[0][0];
            //calculate step size
            let step = (knots[knots.length - 1][0] - min) / resolution;
            // calculate u values here to prevent rounding errors
            let values = new Array<number>();
            for (let h = 0; h <= resolution; h++) {
                // round values to assure the last value being the max knot value
                values.push(Math.round(min + h * step * 10000) / 10000);
            }
            return values;
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
            // pre calculate u values from indices
            const uOfI = this.translateIndex(knots, index);
            const uOfIplusDegreePlus1 = this.translateIndex(knots, index + degree + 1); 
            
            // CASE 1: u lies outside the support range -> return 0
            if (u_value < uOfI || u_value >= uOfIplusDegreePlus1) return 0;
            // degree is 0 -> constant line of 1
            if (degree == 0) return 1;
            
            // CASE 2: calculate from alpha and previous N values
            let fac1 = (u_value - uOfI) / 
                (this.translateIndex(knots, index + degree) - uOfI);
            let fac2 = (uOfIplusDegreePlus1 - u_value) / 
                (uOfIplusDegreePlus1 - this.translateIndex(knots, index + 1));
            // prevent e.g. dividing by 0 (which happens)
            if(!isFinite(fac1)) fac1 = 0;
            if(!isFinite(fac2)) fac2 = 0;
            // return sum of previous N (with factor alpha)
            return fac1 * prevN1 + fac2 * prevN2;
    }

    /**
     * calculate all base functions for the knot sequence up to the given degree.
     * 
     * @param knots 
     * @param degree 
     * @param resolution 
     * @returns all base function values in an array of [degree][j][u]
     */
    public static generateBaseFunctions(
        knots: Array<[number, number]>, 
        degree: number,
        resolution: number): Array<Array<Array<number>>>{
            // array of return values
            const bases = Array<Array<Array<number>>>();
            
            // pre calculate u values to prevent rounding errors
            const values = this.generateUValues(knots, resolution);

            // handle fencepost n = 0, because previous values do not exist
            bases.push(Array<Array<number>>());
            for (let idx = 0; idx <= this.getKnotLength(knots) - 1; idx++) {
                bases[0].push(Array<number>());
                // for each index
                for (let u = 0; u <= resolution; u++) {
                    bases[0][idx].push(this.calculateNValue(knots, 0, idx, values[u], 0, 0));
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
                        bases[n][idx].push(
                            this.calculateNValue(knots, n - 1, idx, values[u], 
                                bases[n-1][idx][u], bases[n-1][idx+1][u])
                        );
                    }
                }
            }
            // return all calculated functions
            return bases;     
    }



    /**
     * calculate curve points for the given knot sequence and control points. does not
     * check whether control points are of valid length
     * 
     * @param knots 
     * @param controlPoints 
     * @param degree 
     * @param resolution 
     * @returns array containing the Vector3 representation that build the curve
     */
    public static calculateCurveWithDeBoor(
        knots: Array<[number,number]>,
        controlPoints: Array<Vector3>,
        degree: number,
        resolution: number): Array<Vector3> {
            const curve = new Array<Vector3>();

            // get left and right side values of support interval
            const lb = this.translateIndex(knots, degree - 1);
            const rb = this.translateIndex(knots, this.getKnotLength(knots) - degree);
            const step = Math.round(((rb - lb) / resolution) * 10000) / 10000;

            //call caluclation function for each u inside the support
            for (let u = lb; u < rb; u += step) {
                const pointOnCurve = this.calculateCurveWithDeBoorSingleU(knots, controlPoints, degree, u);
                curve.push(pointOnCurve);
            }

            // return calculated array of curve points
            return curve;
    }

    /**
     * calculate de Boor  Algorithm for single value of u on the curve
     * 
     * @param knots 
     * @param controlPoints 
     * @param degree 
     * @param u 
     * @returns
     */
    public static calculateCurveWithDeBoorSingleU(
        knots: Array<[number,number]>,
        controlPoints: Array<Vector3>,
        degree: number,
        u: number): Vector3 {
            // find left side Index I
            const I = this.findIndexForU(knots, u) - 1;

            //calculate mulitplicity of u that is already in the sequence
            let r = 0;
            knots.every(value => {
                if (value[0] == u) {
                    r += value[1];
                    return false;
                } 
                return true;
            });

            // create array for de Boor values
            const ds = new Array<Array<Vector3>>();
            // pre fill already known values
            for (let z = 0; z <= r; z++) {
                ds.push(new Array<Vector3>());
                for (let x = r; x <= degree; x++) {
                    ds[z].push(controlPoints[I - degree + x + 1].clone());
                }
            }

            // see algorithm 8.1 -> directly written from it
            for (let k = r + 1; k <= degree; k++) {
                ds.push(new Array<Vector3>());
                for (let j = 0; j <= degree - k; j++) {
                    // calculate coeffficient
                    let alpha = (u - this.translateIndex(knots, I - degree + k + j)) /
                        (this.translateIndex(knots, I + 1 + j) - this.translateIndex(knots, I - degree + k + j));
                    // prevent NaN / Infinity
                    if (!isFinite(alpha)) alpha = 0;
                    // TODO makeshift way of fixing errors?
                    // if (isNaN(alpha)) {
                    //     alpha = 1;
                    // } else if (!isFinite(alpha)) alpha = 0;

                    // get left side value
                    const dkj = ds[k - 1][j].clone().multiplyScalar(1 - alpha)
                    // get right side value
                    const dkj2 = ds[k - 1][j + 1].clone().multiplyScalar(alpha);
                    // add values and handle rounding errors
                    const result = dkj.add(dkj2);
                    // TODO should you round here?
                    result.multiplyScalar(10000).round().divideScalar(10000);
                    // add result to end of list
                    ds[k].push(result);
                }
            }
            return ds[degree][0];
    }
}
