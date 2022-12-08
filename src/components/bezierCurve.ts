import { Vector3, Group } from "three";
import { CustomLine } from "../core/customLine";
import { BezierGenerator } from "../generators/bezier";

/**
 * This interface should allow foreign object to get a callback
 * if a value of the `BezierCurve` changes.
 */
export interface BezierCurveObserver {

    /**
     * The ``BezierCurve`` invokes this function if the control 
     * points changed. It sends a buffer of the current control
     * point's positions.
     * @param buffer contains the new points as a `Vector3`
     */
    controlPoints(buffer: Array<Vector3>): void;

    /**
     * The ``BezierCurve`` invokes this function
     * if the ``controlPolygon`` is toggled.
     */
    controlPolygon(state: boolean): void;
}

/**
 * ``BezierCurve`` governs all values in respect to the 
 * curve itself (curve line and control polygon).
 */
export class BezierCurve extends Group {

    private _resolution: number;
    private _observers: Array<BezierCurveObserver>;

    private _curve: CustomLine;
    private _controlPolygon: CustomLine;

    constructor() {
        super();

        this._resolution = 100;
        this._observers = new Array<BezierCurveObserver>();

        this._curve = new CustomLine();
        this._controlPolygon = new CustomLine();

        this.add(this._curve);
        this.add(this._controlPolygon);
    }

    public register(obs: BezierCurveObserver): void {
        this._observers.push(obs);
    }

    /**
     * The `controlPolygon` set the data for the control polygon
     * and update the presented curve.
     */
    public set controlPolygon(points: Array<Vector3>) {
        this._controlPolygon.data = points;
        this._curve.data = BezierGenerator.generateBezierCurve(points, this.resolution);
        this._observers.forEach(obs => obs.controlPoints(points));
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
        this._curve.data = BezierGenerator.generateBezierCurve(this.controlPoints(), this.resolution);
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
        this._observers.forEach(obs => obs.controlPolygon(state));

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