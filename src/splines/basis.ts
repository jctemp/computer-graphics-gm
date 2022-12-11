import { GridHelper, Group, Vector3 } from "three";
import { primaryColor } from "../core/color";
import { Slot } from "../core/connector";
import { CustomLine } from "../core/customLine";
import { CustomPoint, Shape } from "../core/customPoint";
import { BasisGenerator } from "../generators/basis";
import { SplineLogic } from "./logic";

export class SplineBasis extends Group {

    public slotTimeValue: Slot<number>;
    public slotResolution: Slot<number>;
    public slotControlPointsCount: Slot<number>;

    private _t: number;
    private _bezierCurveResolution: number;
    private _bezierCurveCount: number;

    private _bernsteinPoints: Array<CustomPoint>;

    constructor() {
        super();

        this.slotTimeValue = new Slot<number>();
        this.slotTimeValue.addCallable(t => {
            this._t = t;
            this.updatePolynomialBasis();
        });

        this.slotResolution = new Slot<number>();
        this.slotResolution.addCallable(resolution => {
            this._bezierCurveResolution = resolution;
            this.resetPolynomialBasis();
        });

        this.slotControlPointsCount = new Slot<number>();
        this.slotControlPointsCount.addCallable(count => {
            this._bezierCurveCount = count;
            this.resetPolynomialBasis();
        });

        this._t = .25;
        this._bezierCurveResolution = 100;
        this._bezierCurveCount = 4;

        this._bernsteinPoints = new Array<CustomPoint>();
    }

    public resetPolynomialBasis(): void {
        // NOTE: we could push and pop form the arrays and other 
        // array manipulations. However, this would introduce
        // unnecessary logic making this function overcomplicated.
        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }

        const grid = new GridHelper(1, 101, 0x444444, 0x222222);
        grid.position.set(0.5, 0.5, 0);
        grid.setRotationFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        this.add(grid);

        let test = new Array<[number,number]>([0,3],[1,1],[2,2],[4,1],[5,1],[7,3])
        let basises = SplineLogic.generateBaseFunctions(test, 5, this._bezierCurveResolution)
        const coefficients = basises[basises.length - 1];
        console.log("number of bases: " + coefficients.length)
        console.log(coefficients)

        coefficients.forEach(coefficient => {
            const line = new CustomLine();
            line.data = coefficient
                .map((y, x) => new Vector3(x / this._bezierCurveResolution, y, 0));
            this.add(line);
        });

        this._bernsteinPoints = new Array<CustomPoint>();
        for (let idx = 0; idx < coefficients.length; idx++) {
            let point = new CustomPoint(Shape.SPHERE, .01);
            point.color = primaryColor[idx];
            point.wireframe = false;
            this._bernsteinPoints.push(point);
            this.add(point);
        }

        this.position.set(-.5, -.5, 0)
        this.updatePolynomialBasis();
    }

    /**
     * updatePolynomialBasis
     */
    public updatePolynomialBasis() {
        // BasisGenerator
        //     .calculateCoefficients(this._bezierCurveCount - 1, this._t)
        //     .forEach((c, idx) => this._bernsteinPoints[idx].position.set(this._t, c, 0));
    }

}