import { Group, Vector3 } from "three";
import { randFloat } from "three/src/math/MathUtils";
import { Signal } from "../core/connector";
import { CustomPoint, Shape } from "../core/customPoint";
import { primaryColor } from "../core/color";

export class ControlPoints2d extends Group {

    /**
     * The `update` function add all points until max to the
     * renderable set.
     */
    public update(): void {
        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }

        const factor = 4;
        for (let idx = 0; idx < this._max[0]; idx++) {
            for (let jdx = 0; jdx < this._max[1]; jdx++) {
                this.add(this.points[idx][jdx]);
                point.buffer = new Vector3(
                    (x * factor) - (ControlPoints2d.MAX * factor / 2),
                    randFloat(0, 1),
                    (y * factor) - (ControlPoints2d.MAX * factor / 2));
            }
        }
        this.signalMaxChanged.emit(null);
    }

    public toggleControlPoints(): void {
        if (this.children.length == 0) {
            for (let idx = 0; idx < this._max[0]; idx++) {
                for (let jdx = 0; jdx < this._max[1]; jdx++) {
                    this.add(this.points[idx][jdx]);
                }
            }
        } else {
            while (this.children.length > 0) {
                const child = this.children.pop();
                child?.removeFromParent();
            }
        }
    }

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER

    public static MAX: number = 10;

    public signalMaxChanged: Signal<null>;
    private _max: [number, number];
    public points: CustomPoint[][];

    constructor() {
        super();
        this.signalMaxChanged = new Signal<null>();

        this.points = [];
        for (let x = 0; x < ControlPoints2d.MAX; x++) {
            this.points.push([]);
            for (let y = 0; y < ControlPoints2d.MAX; y++) {
                let point = new CustomPoint(Shape.CUBE, 1);
                point.dragUpdate = () => this.signalMaxChanged.emit(null);
                point.color = 0xEEEE00;

                this.points[x].push(point);
            }
        }

        this._max = [3, 5];
    }

    public get positions(): Vector3[][] {
        let pointArr: Vector3[][] = [];
        for (let idx = 0; idx < this._max[0]; idx++) {
            pointArr.push([]);
            for (let jdx = 0; jdx < this._max[1]; jdx++) {
                pointArr[idx].push(this.points[idx][jdx].position.clone());
            }
        }
        return pointArr;
    }

    public get xMax(): number {
        return this._max[0];
    }

    public get yMax(): number {
        return this._max[1];
    }

    public set xMax(value: number) {
        const x = Math.max(Math.min(value, ControlPoints2d.MAX), 0);
        this._max[0] = x;
        this.update();
    }

    public set yMax(value: number) {
        const y = Math.max(Math.min(value, ControlPoints2d.MAX), 0);
        this._max[1] = y;
        this.update();
    }
}

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
        this._points = [];
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