import { Group, Vector3 } from "three";
import { randFloat } from "three/src/math/MathUtils";
import { Signal } from "../core/connector";
import { CustomPoint, Shape } from "../core/customPoint";
import { primaryColor } from "../core/color";

/**
 * The `ControlPoints1d` class manages a set of control points
 * which are used to determine the shape of a curve.
 */
export class ControlPoints1d extends Group {

    /**
     * The `update` function add all points until max to the
     * renderable set.
     */
    public update(): void {
        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }

        for (let idx = 0; idx < this._max; idx++) {
            this.add(this._points[idx]);
        }
        this.signalMaxChanged.emit(null);
    }

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER

    public signalMaxChanged: Signal<null>;
    public _max: number;
    public _points: CustomPoint[];

    constructor() {
        super();
        this.signalMaxChanged = new Signal<null>();
        this._points = new Array<CustomPoint>();
        for (let idx = 0; idx < primaryColor.length; idx++) {
            let point = new CustomPoint(Shape.CUBE, 1);

            point.buffer = (new Vector3(
                randFloat(-10, 10), randFloat(-10, 10), 0));
            point.dragUpdate = () => this.signalMaxChanged.emit(null);
            point.color = primaryColor[this._points.length];

            this._points.push(point);
        }

        this._max = 4;
        this.max = this._max;
    }

    public get max(): number {
        return this._max;
    }

    public set max(value: number) {
        this._max = Math.max(Math.min(value, primaryColor.length), 0);
        this.update();
    }




}