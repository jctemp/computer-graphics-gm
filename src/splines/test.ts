import { Vector3 } from "three";
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
        const length = SplineLogic.getKnotLength(knots);
        if (length != 8) throw new Error("Length assertion failed");

        // test for index translation
        const knotsLong = new Array<number>(0,0,0,1,2,3,3,3);
        for (let idx = 0; idx < length; idx++) {
            let u = SplineLogic.translateIndex(knots, idx);
            if (u != knotsLong[idx]) throw new Error("Index translation failed at: " + idx);
        }

        // test for abscissae calculation
        const abscissae = SplineLogic.generateAbscissae(knots, degree);
        const compareValues = new Array<number>(0,1/3,1,2,8/3,3);
        for (let idx = 0; idx < compareValues.length; idx++) {
            if (compareValues[idx] != abscissae[idx]) throw new Error("abscissae evaluation failed");
        }

        // test base function calculation method
        const functions = SplineLogic.generateBaseFunctions(knots, degree, resolution);
        // for each degree test whether all functions sum up to 1 inside the support
        // pre calculate u values to prevent rounding errors
        const values = SplineLogic.generateUValues(knots, resolution);
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
        
        // fill control Polygon with values and calculate curve with de Boor
        const controlPolygon = new Array<Vector3>();
        // fill control polygon
        controlPolygon.push(new Vector3(-6,0,0));
        controlPolygon.push(new Vector3(-4,0,0));
        controlPolygon.push(new Vector3(-2,0,0));
        controlPolygon.push(new Vector3(0,0,0));
        controlPolygon.push(new Vector3(-8,0,0));
        controlPolygon.push(new Vector3(0,0,0));
        controlPolygon.push(new Vector3(8,0,0));
        controlPolygon.push(new Vector3(4,0,0));
        controlPolygon.push(new Vector3(2,0,0));
        // fill knot sequence
        const knots2 = new Array<[number, number]>([-10,1],[-6,1],[-2,2],[0,1],[4,1],[8,1],[12,1],[16,1],[18,1]);
        // run algorithm
        const curve = SplineLogic.calculateCurveWithDeBoor(knots2, controlPolygon, 2, 22);
        // TODO find out where 6 is because 6 => 0

        // output that tests completed on dev console
        console.log("completed tests for bSpline-functions");
    }
}
