import { Group, Vector3 } from "three";
import { randFloat } from "three/src/math/MathUtils";
import { Signal } from "../core/connector";
import { CustomPoint, Shape } from "../core/customPoint";
import { primaryColor } from "../core/color";

/**
 * abstract super class for any kind of control point objects
 */
export abstract class ControlPoints extends Group {

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER
    /// -----------------------------------------------------------------------
   
    public signalMaxChanged: Signal<null>;

    constructor() {
        super();

        this.signalMaxChanged = new Signal<null>();
    }

    /// -----------------------------------------------------------------------
    /// ABSTRACT FUNCTIONS FOR OVERRIDE
    /// -----------------------------------------------------------------------

    abstract update(): void;
    abstract listControlPoints(): CustomPoint[];
}

export class ControlPoints2d extends ControlPoints {

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER
    /// -----------------------------------------------------------------------
   
    public static MAX: number = 10;

    public _points: CustomPoint[][];
    private _plane: boolean;
    private _max: [number, number];
    private _activated: boolean;

    constructor() {
        super();

        this._points = [];
        for (let x = 0; x < ControlPoints2d.MAX; x++) {
            this._points.push([]);
            for (let y = 0; y < ControlPoints2d.MAX; y++) {
                let point = new CustomPoint(Shape.CUBE, 1);
                point.dragUpdate = () => this.signalMaxChanged.emit(null);
                point.color = 0xEEEE00;

                this._points[x].push(point);
            }
        }

        this._plane = false;
        this._activated = true;
        this._max = [3, 5];
        this.changePositions();
    }

    public get positions(): Vector3[][] {
        let pointArr: Vector3[][] = [];
        for (let idx = 0; idx < this._max[0]; idx++) {
            pointArr.push([]);
            for (let jdx = 0; jdx < this._max[1]; jdx++) {
                pointArr[idx].push(this._points[idx][jdx].position.clone());
            }
        }
        return pointArr;
    }

    public get plane(): boolean {
        return this._plane;
    }

    public set plane(value: boolean) {
        this._plane = value;
        this.changePositions();
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
        this.changePositions();
        this.update();
    }

    public set yMax(value: number) {
        const y = Math.max(Math.min(value, ControlPoints2d.MAX), 0);
        this._max[1] = y;
        this.changePositions();
        this.update();
    }

    /// -----------------------------------------------------------------------
    /// CLASS METHODS
    /// ----------------------------------------------------------------------- 

    /**
     * `toggleControlPoints` adds or removes the children from the
     * renderable set. Only active points are considered.
     */
    public toggleControlPoints(): void {
        this._activated = !this._activated;
        if (this.children.length == 0) {
            for (let idx = 0; idx < this._max[0]; idx++) {
                for (let jdx = 0; jdx < this._max[1]; jdx++) {
                    this.add(this._points[idx][jdx]);
                }
            }
        } else {
            while (this.children.length > 0) {
                const child = this.children.pop();
                child?.removeFromParent();
            }
        }
    }

    /**
     * `changePosition` is a private utility function to set
     * the positions of current visible points.
     */
    private changePositions(): void {
        if (this.plane) {
            const factor = 5;
            for (let idx = 0; idx < this._max[0]; idx++) {
                for (let jdx = 0; jdx < this._max[1]; jdx++) {
                    const x = (idx - (this._max[0] / 2));
                    const y = (jdx - (this._max[1] / 2));
                    this._points[idx][jdx].buffer = new Vector3(factor * x, 0, factor * y);
                }
            }
        } else {
            const radius = 10;
            for (let idx = 0; idx < this._max[0]; idx++) {
                for (let jdx = 0; jdx < this._max[1]; jdx++) {
                    const theta = (idx / (this._max[0] - 1)) * .5 * Math.PI + .25 * Math.PI;
                    const phi = (-jdx / (this._max[1] - 1)) * 2 * Math.PI;

                    this._points[idx][jdx].buffer = new Vector3(
                        radius * Math.sin(theta) * Math.cos(phi),
                        radius * Math.sin(theta) * Math.sin(phi),
                        radius * Math.cos(theta)
                    );
                }
            }
        }
    }

    /// -----------------------------------------------------------------------
    /// OVERRIDES
    /// -----------------------------------------------------------------------
    
    /**
     * The `update` function add all points until max to the
     * renderable set.
     */
    override update(): void {
        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }

        if (this._activated) {
            for (let idx = 0; idx < this._max[0]; idx++) {
                for (let jdx = 0; jdx < this._max[1]; jdx++) {
                    this.add(this._points[idx][jdx]);
                }
            }
        }

        this.signalMaxChanged.emit(null);
    }

    /**
     * wrap up all points in a single 1D array
     * @returns Array of CustomPoints
     */
    override listControlPoints(): CustomPoint[] {
        const result = new Array<CustomPoint>();
        this._points.forEach(value => {
            value.forEach(p => {
                result.push(p);
            })
        });
        return result;
    }
}




/**
 * The `ControlPoints1d` class manages a set of control points
 * which are used to determine the shape of a curve.
 */
export class ControlPoints1d extends ControlPoints {

    /// -----------------------------------------------------------------------
    /// CONSTRUCTOR, GETTER and SETTER
    /// -----------------------------------------------------------------------
    
    public _max: number;
    public _points: CustomPoint[];

    constructor() {
        super();

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

    /// -----------------------------------------------------------------------
    /// OVERRIDES
    /// -----------------------------------------------------------------------
    
    /**
     * The `update` function add all points until max to the
     * renderable set.
     */
    override update(): void {
        while (this.children.length > 0) {
            const child = this.children.pop();
            child?.removeFromParent();
        }

        for (let idx = 0; idx < this._max; idx++) {
            this.add(this._points[idx]);
        }
        this.signalMaxChanged.emit(null);
    }

    /**
     * acts as a simple getter for the control points
     * @returns Array of CustomPoints
     */
    override listControlPoints(): CustomPoint[] {
        return this._points;
    }
}