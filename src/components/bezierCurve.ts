import { Vector3, Group } from "three";
import { Signal } from "../core/connector";
import { CustomLine } from "../core/customLine";
import { BezierLogic } from "../logic/bezier";

/**
 * ``BezierCurve`` governs all values in respect to the 
 * curve itself (curve line and control polygon).
 */
export class BezierCurve extends Group {

    // Emits a signal if the control points in any from.
    public signalControlPoints: Signal<Array<Vector3>>;

    // Emits a signal if the visibility of the control
    // polygon changes through the toggle.
    public signalControlPolygon: Signal<boolean>;

    // Emits a signal if the resolution changes
    public signalResolution: Signal<number>;

    // Emits the current length of the controlpoint list.
    public signalControlPointsCount: Signal<number>;

    private _resolution: number;

    private _curve: CustomLine;
    private _controlPolygon: CustomLine;

    constructor() {
        super();

        this.signalControlPoints = new Signal<Array<Vector3>>();
        this.signalControlPolygon = new Signal<boolean>();
        this.signalControlPointsCount = new Signal<number>();
        this.signalResolution = new Signal<number>();

        this._resolution = 100;

        this._curve = new CustomLine();
        this._controlPolygon = new CustomLine();

        this.add(this._curve);
        this.add(this._controlPolygon);
    }

    /**
     * The `controlPolygon` set the data for the control polygon
     * and update the presented curve.
     */
    public set controlPolygon(points: Array<Vector3>) {
        this._controlPolygon.data = points;
        this._curve.data = BezierLogic.generateBezierCurve(points, this.resolution);
        this.signalControlPoints.emit(points);
        this.signalControlPointsCount.emit(points.length);
        this.signalResolution.emit(this.resolution);
    }

    /**
     * Gets the current resolution of the curve.
     */
    public get resolution(): number {
        return this._resolution;
    }

    /**
     * Sets the current resolution of the curve, which means the
     * amount of point created to represent the curve. A high
     * resolution means a smoother curve.
     */
    public set resolution(resolution: number) {
        this._resolution = resolution;
        this._curve.data = BezierLogic.generateBezierCurve(this.controlPoints(), this.resolution);
    }

    /**
     * Add or removes the control polygon from the rendering.
     */
    public toggleControlPolygon(): void {
        let idx = this.children.findIndex(obj => obj === this._controlPolygon);
        let state = false;
        if (idx != -1) {
            this.children = this.children.filter((_, jdx) => idx !== jdx);
        } else {
            this.add(this._controlPolygon);
            state = true;
        }
        this.signalControlPolygon.emit(state);
    }

    /**
     * `controlPoints` is a helper function to determine the `Vector3`
     * representation of the plain values in the Buffer.
     * @returns 
     */
    public controlPoints(): Array<Vector3> {
        const buffer = this._controlPolygon.geometry.getAttribute("position").array;
        const points = new Array<Vector3>();
        for (let idx = 0; idx < buffer.length; idx += 3) {
            let p = new Vector3(
                buffer[idx],
                buffer[idx + 1],
                buffer[idx + 2]
            );
            points.push(p);
        }
        return points;
    }
}