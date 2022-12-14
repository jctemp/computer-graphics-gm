import { GridHelper, Group, Vector3 } from "three";
import { primaryColor } from "../core/color";
import { Slot } from "../core/connector";
import { CustomLine } from "../core/customLine";
// TODO i swear you can do this dynamically
import { PolynomialBasisLogic } from "../logic/polynomialBasisLogic";
import { SplineLogic } from "../logic/splinesLogic";

/**
 * The `Basis` class describes the polynomial basis of degree n. It creates
 * all corresponding polynomials regarding a degree. In addition, 
 */
abstract class Basis extends Group {

    /**
     * The `set` function recalculates the values for the current curve.
     * @param degree of the curve
     * @param resolution sampling accuracy
     */
    public set(degree: number, resolution: number, knots: Array<[number, number]> = new Array<[number, number]>): void {
        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }

        const grid = new GridHelper(1, 100, 0x444444, 0x222222);
        grid.position.set(0.5, 0.5, 0);
        grid.setRotationFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        this.add(grid);

        this.add(this._bar);

        const coefficients = this.calc(degree, resolution, knots);
        coefficients.forEach((coeffs, idx) => {
            const line = new CustomLine();
            line.color = primaryColor[idx];
            line.buffer = coeffs.map(
                (y, x) => new Vector3(x / resolution, y, 0));
            this.add(line);
        });

        this.position.set(-.5, -.5, 0)
        this.update();
    }

    /**
     * The ``update`` function moves the bar along the x-axis, showing the
     * influences of the curves at t.
     */
    public update() {
        this._bar.buffer = [
            new Vector3(this._t, 1),
            new Vector3(this._t, 0)
        ];
    }

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER

    public slotTime: Slot<number>;

    private _t: number;
    private _bar: CustomLine;

    constructor() {
        super();

        this.slotTime = new Slot<number>();
        this.slotTime.addCallable((time) => {
            this._t = time;
            this.update();
        })

        this._t = .25;
        this._bar = new CustomLine();
        this._bar.renderOrder = 1;
        this._bar.color = 0xAAAAAA;
    }

    abstract calc(degree: number, resolution: number, knots: Array<[number, number]>): Array<Array<number>>;
}

export class PolyBase extends Basis {
    override calc(degree: number, resolution: number): Array<Array<number>> {
        return PolynomialBasisLogic.generateBasis(degree, resolution);
    }
}

export class SplineBase extends Basis {
    override calc(degree: number, resolution: number, knots: Array<[number, number]>): Array<Array<number>> {
        const baseFunctions = SplineLogic.generateBaseFunctions(knots, degree, resolution);
        return baseFunctions[baseFunctions.length - 1];
    }
}