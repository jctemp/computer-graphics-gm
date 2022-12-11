import { GridHelper, Group, Vector3 } from "three";
import { Slot } from "../core/connector";
import { CustomLine } from "../core/customLine";
import { SplineLogic } from "./logic";

export class SplineBasis extends Group {

    // resolution
    public slotResolution: Slot<number>;
    private _resolution: number;

    // degree
    public slotDegree: Slot<number>;
    private _degree: number;

    // knot list
    public slotKnots: Slot<Array<[number,number]>>;
    private _knots: Array<[number,number]>;

    constructor() {
        super();

        // preset resolution
        this.slotResolution = new Slot<number>();
        this.slotResolution.addCallable(resolution => {
            this._resolution = resolution;
            this.resetPolynomialBasis();
        });
        this._resolution = 100;

        // preset degree
        this.slotDegree = new Slot<number>();
        this.slotDegree.addCallable(n => {
            // TODO only calculate values above the previous
            this._degree = n;
            this.resetPolynomialBasis();
        });
        this._degree = 5;

        // preset knots
        this.slotKnots = new Slot<Array<[number,number]>>();
        this.slotKnots.addCallable(knot => {
            // TODO can this kind of know if only a knot was inserted?
            this._knots = knot;
            this.resetPolynomialBasis();
        });
        // TODO remove preset hardcode? (!)
        this._knots = new Array<[number,number]>([0,3],[1,1],[2,2],[3,1],[5,1],[9,2]);
    }

    /**
     * calculates all basis functions for the current values of this class from scratch
     */
    public resetPolynomialBasis(): void {
        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }

        // TODO make this a default value of divisions?
        const grid = new GridHelper(1, this._resolution, 0x444444, 0x222222);
        grid.position.set(0.5, 0.5, 0);
        grid.setRotationFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        this.add(grid);

        // calculate all base functions
        let basises = SplineLogic.generateBaseFunctions(this._knots, this._degree, this._resolution)
 
        // get highest degree functions for writing their values to the diagram
        const coefficients = basises[basises.length - 1];
        coefficients.forEach(coefficient => {
            const line = new CustomLine();
            line.data = coefficient
                .map((y, x) => new Vector3(x / this._resolution, y, 0));
            this.add(line);
        });

        this.position.set(-.5, -.5, 0)
    }

}