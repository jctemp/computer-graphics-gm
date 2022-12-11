import { SplineLogic } from "./logic";

export class SplineTest {
    public static testLogic() {
        // sample knot sequence
        const knots = new Array<[number, number]>([0,3],[1,1],[2,1],[3,3]);
        // test degree
        const degree = 3;
        // test resolution for curve
        const resolution = 1000;
        // degree of error (rounding)
        const epsilon = 0.00001;

        // test for length calculation
        let length = SplineLogic.getKnotLength(knots);
        if (length != 8) throw new Error("Length assertion failed");

        // test for index translation
        let knotsLong = new Array<number>(0,0,0,1,2,3,3,3);
        for (let idx = 0; idx < length; idx++) {
            let u = SplineLogic.translateIndex(knots, idx);
            if (u != knotsLong[idx]) throw new Error("Index translation failed at: " + idx);
        }

        // test for abscissae calculation
        let abscissae = SplineLogic.generateAbscissae(knots, degree);
        const compareValues = new Array<number>(0,1/3,1,2,8/3,3);
        for (let idx = 0; idx < compareValues.length; idx++) {
            if (compareValues[idx] != abscissae[idx]) throw new Error("abscissae evaluation failed");
        }

        // test base function calculation method
        let functions = SplineLogic.generateBaseFunctions(knots, degree+2, resolution);
        // for each degree test whether all functions sum up to 1 inside the support
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
        for (let degree = 0; degree < functions.length; degree++) {
            for (let i = 0; i <= resolution; i++) {
                let sum = 0;
                functions[degree].forEach(v => sum += v[i]);
                // test if current value is inside support range
                if (values[i] >= SplineLogic.translateIndex(knots, degree) && 
                    values[i] < SplineLogic.translateIndex(knots, length - degree)) {
                        // test if value is outside epsilon-radius
                        if (sum > 1 + epsilon || sum < 1 - epsilon) {
                            throw new Error("calculating base functions failed");   
                        } 
                }
            }
        }

        // output that tests completed on dev console
        console.log("completed tests for bSpline-functions");
    }
}
