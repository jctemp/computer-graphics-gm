import { GridHelper, Group, Vector3 } from "three";
import { primaryColor } from "./color";
import { Slot } from "./connector";
import { CustomLine } from "./customLine";

/**
 * The `Basis` class describes the polynomial basis of degree n. It creates
 * all corresponding polynomials regarding a degree. In addition, 
 */
export class Basis extends Group {

    /**
     * The `set` function recalculates the values for the current curve.
     * @param degree of the curve
     * @param resolution sampling accuracy
     */
    public set(coefficients: number[][]): void {

        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }

        const grid = new GridHelper(1, 100, 0x444444, 0x222222);
        grid.position.set(0.5, 0.5, 0);
        grid.setRotationFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        this.add(grid);

        this.add(this._bar);
        if (coefficients.length !== 0) {

            const resolution = coefficients[0].length;
            coefficients.forEach((coeffs, idx) => {
                const line = new CustomLine();
                line.color = primaryColor[idx];
                line.buffer = coeffs.map(
                    (y, x) => new Vector3(x / resolution, y, 0));
                this.add(line);
            });
        }

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
}