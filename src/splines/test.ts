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

        let functions = SplineLogic.generateBaseFunctions(knots, degree, resolution);
        for (let i = 0; i < resolution; i++) {
            for (let j = 1; j < functions.length - 1; j++) {
                let sum = 0;
                functions[j].forEach(v => sum += v[j]);
                //if (sum > 1 + epsilon || sum < 1 - epsilon) throw new Error("calculating base functions failed");    
            }
        }
        console.log(functions[functions.length - 1])

        console.log("completed tests for bSpline-functions");
    }
}
